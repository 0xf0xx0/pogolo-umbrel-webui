// Live pogolo log stream.
//
// pogolo runs in its own container and umbrelOS does not expose the docker
// socket to apps, so we tail the log file it writes to the shared data volume.
// Lines are kept in a small ring buffer so a newly-connected client immediately
// sees recent history instead of an empty pane until pogolo next logs something.

import fs from 'node:fs'
import fsp from 'node:fs/promises'

import {ansiToHtml} from '../../lib/ansi-to-html.js'
import {POGOLO_LOG} from '../../lib/paths.js'

import type WebSocket from 'ws'
import type {LogLine} from '#types'

// Lines retained for replay to newly-connected clients.
const HISTORY_LIMIT = 500

// How often we look for new data. The file is on a local volume, so this is a
// cheap stat; watch() alone is not enough because it misses writes on some
// bind-mounted filesystems.
const POLL_INTERVAL_MS = 1000

// Bytes of existing log to replay on startup, so the pane is not empty after a
// webui restart. Only whole lines within this window are used.
const BACKFILL_BYTES = 64 * 1024

const history: LogLine[] = []
const clients = new Set<WebSocket>()

let seq = 0
let started = false

// Where we have read up to, and what we are reading. Tracking the inode lets us
// notice when the file is replaced by log rotation rather than appended to.
let offset = 0
let inode: number | undefined

// Carry for a trailing partial line between reads
let pending = ''

// poll() is triggered by both the watcher and the interval. Without this guard
// two overlapping runs can read the same bytes before either advances `offset`,
// which shows up as duplicated log lines.
let polling = false
let pollAgain = false

function push(line: string) {
	// Drop stray control characters (keeping the ESC that starts a colour
	// sequence) plus trailing whitespace.
	const cleaned = line.replace(/[\x00-\x08\x0b-\x1a\x1c-\x1f]/g, '').trimEnd()
	if (!cleaned) return

	const entry: LogLine = {
		seq: seq++,
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

// Run one read pass. Never call this directly — go through poll().
async function readOnce() {
	let handle: fsp.FileHandle | undefined

	try {
		handle = await fsp.open(POGOLO_LOG, 'r')
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

// Serialize read passes. A trigger that arrives mid-read queues exactly one
// follow-up, so we never miss the write that caused it.
async function poll(): Promise<void> {
	if (polling) {
		pollAgain = true
		return
	}

	polling = true
	try {
		do {
			pollAgain = false
			await readOnce()
		} while (pollAgain)
	} finally {
		polling = false
	}
}

// Begin following pogolo's log file. Safe to call more than once.
export function startLogStream() {
	if (started) return
	started = true

	void poll()

	const timer = setInterval(() => void poll(), POLL_INTERVAL_MS)
	// Never keep the process alive just for log polling
	timer.unref()

	// watch() gives us near-instant updates when the filesystem supports it;
	// the interval above is the fallback that guarantees we still catch up.
	try {
		const watcher = fs.watch(POGOLO_LOG, () => void poll())
		watcher.on('error', () => {
			/* the poll interval keeps working on its own */
		})
		watcher.unref()
	} catch {
		// File may not exist yet, or the platform may not support watching it.
	}
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
