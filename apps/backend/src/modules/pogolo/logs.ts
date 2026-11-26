// Live pogolo log stream.
//
// pogolo runs in its own container and umbrelOS does not expose the docker
// socket to apps, so we tail the log file it writes to the shared data volume.
// Lines are kept in a small ring buffer so a newly-connected client immediately
// sees recent history instead of an empty pane until pogolo next logs something.

import {spawn} from 'node:child_process'
import fsp from 'node:fs/promises'
import path from 'node:path'

import type {ChildProcess} from 'node:child_process'

import {ansiToHtml} from '../../lib/ansi-to-html.js'
import {POGOLO_LOG} from '../../lib/paths.js'

import type WebSocket from 'ws'
import type {LogLine} from '#types'

// Lines retained for replay to newly-connected clients.
const HISTORY_LIMIT = 500

// inotifywait provides immediate updates; polling remains a fallback for
// bind-mounted filesystems that do not reliably deliver inotify events.
const POLL_INTERVAL_MS = 1000

// Restart inotifywait itself if it exits unexpectedly.
const WATCH_RETRY_MS = 1000

// Bytes of existing log to replay on startup, so the pane is not empty after a
// webui restart. Only whole lines within this window are used.
const BACKFILL_BYTES = 64 * 1024

const LOG_FILE = path.resolve(POGOLO_LOG)
const LOG_DIRECTORY = path.dirname(LOG_FILE)

const history: LogLine[] = []
const clients = new Set<WebSocket>()

let seq = new Uint32Array(1)
let started = false

// Where we have read up to, and what we are reading. Tracking the inode lets us
// notice when the file is replaced by log rotation rather than appended to.
let offset = 0
let inode: number | undefined

// Carry for a trailing partial line between reads
let pending = ''

// inotifywait can emit several events for one write. Serialize read passes so
// overlapping drains cannot read the same bytes and duplicate log lines.
let reading = false
let readAgain = false

let watcher: ChildProcess | undefined
let watchRetry: NodeJS.Timeout | undefined

function push(line: string) {
	// Drop stray control characters (keeping the ESC that starts a colour
	// sequence) plus trailing whitespace.
	const cleaned = line.replace(/[\x00-\x08\x0b-\x1a\x1c-\x1f]/g, '').trimEnd()
	if (!cleaned) return

	const entry: LogLine = {
		/// use a random sequence so the frontend displays the new logs after a backend restart
		seq: crypto.getRandomValues(seq)[0],
		timestamp: Date.now(),
		html: ansiToHtml(cleaned),
	}

	history.push(entry)
	if (history.length > HISTORY_LIMIT) history.shift()

	const payload = JSON.stringify(entry)
	for (const ws of clients) {
		if (ws.readyState === ws.OPEN) ws.send(payload)
	}
}

// Split a chunk into whole lines, buffering any trailing partial line.
function emitText(text: string) {
	pending += text
	const lines = pending.split('\n')
	// Keep the last (possibly partial) line buffered
	pending = lines.pop() ?? ''
	for (const line of lines) push(line)
}

// Read from `offset` to the end of the file.
async function readNewData(handle: fsp.FileHandle, size: number) {
	if (size <= offset) return

	const length = size - offset
	const buffer = Buffer.alloc(length)
	const {bytesRead} = await handle.read(buffer, 0, length, offset)
	offset += bytesRead

	emitText(buffer.subarray(0, bytesRead).toString('utf8'))
}

// Run one read pass. Never call this directly — go through drain().
async function readOnce() {
	let handle: fsp.FileHandle | undefined

	try {
		handle = await fsp.open(LOG_FILE, 'r')
		const stats = await handle.stat()

		const isNewFile = inode !== undefined && stats.ino !== inode
		// Truncated in place (e.g. `> pogolo.log`) or rotated to a fresh file
		const isTruncated = stats.size < offset

		if (isNewFile || isTruncated) {
			offset = 0
			pending = ''
		}

		// First time we have seen this file: skip most of the existing content so
		// we do not replay an enormous log, but keep a tail for context.
		if (inode === undefined || isNewFile) {
			offset = Math.max(0, stats.size - BACKFILL_BYTES)
			// Drop a partial first line from the middle of the file
			if (offset > 0) {
				const probe = Buffer.alloc(BACKFILL_BYTES)
				const {bytesRead} = await handle.read(probe, 0, BACKFILL_BYTES, offset)
				const text = probe.subarray(0, bytesRead).toString('utf8')
				const firstBreak = text.indexOf('\n')
				if (firstBreak !== -1) offset += firstBreak + 1
			}
		}

		inode = stats.ino

		await readNewData(handle, stats.size)
	} catch (error) {
		// The file may not exist until pogolo first writes to it; just wait.
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.error('Failed to read pogolo log:', error)
		}
	} finally {
		await handle?.close()
	}
}

// Serialize read passes. An event that arrives mid-read queues exactly one
// follow-up, so we never miss the write that caused it.
async function drain(): Promise<void> {
	if (reading) {
		readAgain = true
		return
	}

	reading = true
	try {
		do {
			readAgain = false
			await readOnce()
		} while (readAgain)
	} finally {
		reading = false
	}
}

function startWatcher() {
	// Watch the directory rather than the file so creation and log rotation are
	// visible even when pogolo.log does not exist yet or is replaced.
	const child = spawn(
		'inotifywait',
		[
			'--monitor',
			'--quiet',
			'--event',
			'modify',
			'--event',
			'close_write',
			'--event',
			'moved_to',
			'--event',
			'moved_from',
			'--event',
			'create',
			'--event',
			'delete',
			'--event',
			'attrib',
			'--format',
			'%w%f',
			LOG_DIRECTORY,
		],
		{stdio: ['ignore', 'pipe', 'pipe']},
	)
	watcher = child

	let output = ''
	let errors = ''
	child.stdout.setEncoding('utf8')
	child.stderr.setEncoding('utf8')

	child.stdout.on('data', (chunk: string) => {
		output += chunk
		const lines = output.split('\n')
		output = lines.pop() ?? ''
		for (const line of lines) {
			if (line === LOG_FILE) void drain()
		}
	})
	child.stderr.on('data', (chunk: string) => {
		errors += chunk
	})

	const restart = (reason: string) => {
		// The close event follows a spawn error; only schedule one restart.
		if (watcher !== child || !started) return
		watcher = undefined
		console.error(`inotifywait stopped watching ${LOG_FILE}: ${reason}. Retrying...`)
		watchRetry = setTimeout(() => {
			watchRetry = undefined
			startWatcher()
		}, WATCH_RETRY_MS)
		watchRetry.unref()
	}

	child.once('error', (error) => restart(error.message))
	child.once('close', (code, signal) => {
		restart(errors.trim() || `exit code ${code ?? 'unknown'}${signal ? ` (${signal})` : ''}`)
	})
}

// Begin following pogolo's log file. Safe to call more than once.
export function startLogStream() {
	if (started) return
	started = true

	startWatcher()
	void drain()

	const timer = setInterval(() => void drain(), POLL_INTERVAL_MS)
	// Never keep the process alive just for fallback log polling.
	timer.unref()

	// Do not leave an orphaned inotifywait process behind on backend shutdown.
	process.once('exit', () => {
		started = false
		if (watchRetry) clearTimeout(watchRetry)
		watcher?.kill()
	})
}

export function wsLogStream(socket: WebSocket) {
	clients.add(socket)

	// Replay recent history so the pane is populated immediately
	for (const entry of history) {
		if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(entry))
	}

	socket.on('close', () => clients.delete(socket))
	socket.on('error', () => clients.delete(socket))
}
