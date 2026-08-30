// Live pogolo log stream.
//
// pogolo runs in its own container, so we read its output through the Docker
// engine API over the mounted docker socket. Lines are kept in a small ring
// buffer so a newly-connected client immediately sees recent history instead of
// an empty pane until pogolo next logs something.

import http from 'node:http'

import {ansiToHtml} from '../../lib/ansi-to-html.js'

import type WebSocket from 'ws'
import type {LogLine} from '#types'

const DOCKER_SOCKET = process.env['DOCKER_SOCKET'] || '/var/run/docker.sock'
const POGOLO_CONTAINER = process.env['POGOLO_CONTAINER'] || 'pogolo'

// Lines retained for replay to newly-connected clients.
const HISTORY_LIMIT = 500

// Backoff between reconnect attempts when the log stream drops or the container
// is not up yet.
const RECONNECT_DELAY_MS = 5000

const history: LogLine[] = []
const clients = new Set<WebSocket>()

let seq = 0
let started = false

function push(line: string) {
	// The frame parser already strips Docker's 8-byte headers. Drop any stray
	// control characters (keeping the ESC that starts a colour sequence) plus
	// trailing whitespace.
	// eslint-disable-next-line no-control-regex
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

// Docker multiplexes stdout/stderr into 8-byte-framed chunks when the container
// has no TTY. We parse the frames so we do not emit header bytes as text.
function createFrameParser(onLine: (line: string) => void) {
	let buffer = Buffer.alloc(0)
	let textBuffer = ''

	const emitText = (text: string) => {
		textBuffer += text
		const lines = textBuffer.split('\n')
		// Keep the last (possibly partial) line buffered
		textBuffer = lines.pop() ?? ''
		for (const line of lines) onLine(line)
	}

	return (chunk: Buffer) => {
		buffer = Buffer.concat([buffer, chunk])

		// A frame header is 8 bytes: [stream_type, 0,0,0, big-endian length]
		while (buffer.length >= 8) {
			const streamType = buffer[0]
			// Header bytes 1-3 are always zero for real frames. If they are not,
			// the container is in TTY mode and the stream is raw text.
			if (streamType > 2 || buffer[1] !== 0 || buffer[2] !== 0 || buffer[3] !== 0) {
				emitText(buffer.toString('utf8'))
				buffer = Buffer.alloc(0)
				return
			}

			const length = buffer.readUInt32BE(4)
			if (buffer.length < 8 + length) break // wait for the rest of the frame

			emitText(buffer.subarray(8, 8 + length).toString('utf8'))
			buffer = buffer.subarray(8 + length)
		}
	}
}

function connect() {
	const request = http.request({
		socketPath: DOCKER_SOCKET,
		path: `/containers/${encodeURIComponent(POGOLO_CONTAINER)}/logs?stdout=1&stderr=1&follow=1&tail=${HISTORY_LIMIT}`,
		method: 'GET',
	})

	const retry = () => setTimeout(connect, RECONNECT_DELAY_MS).unref()

	request.on('response', (response) => {
		if (response.statusCode !== 200) {
			response.resume() // drain so the socket can be reused
			retry()
			return
		}

		const parse = createFrameParser(push)
		response.on('data', parse)
		response.on('end', retry)
		response.on('error', retry)
	})

	request.on('error', retry)
	request.end()
}

// Begin following the pogolo container's logs. Safe to call more than once.
export function startLogStream() {
	if (started) return
	started = true
	connect()
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
