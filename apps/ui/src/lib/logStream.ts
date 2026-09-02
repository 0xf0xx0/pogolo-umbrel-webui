// Log websocket, kept outside React.
//
// The log pane appends DOM nodes rather than re-rendering a list, so it needs a
// plain subscription rather than a hook that stores lines in state. A single
// socket is shared by all subscribers and reconnects on its own.

import {api} from '@/lib/api'

import type {LogLine} from '#types'

// Lines retained for replay to a subscriber that mounts later.
export const MAX_LINES = 500

type Handlers = {
	onBacklog: (lines: LogLine[]) => void
	onLine: (line: LogLine) => void
	onOpen?: () => void
	onClose?: () => void
}

const buffer: LogLine[] = []
const subscribers = new Set<Handlers>()

// Sequence numbers already buffered, so a reconnect that replays server-side
// history does not duplicate what we already hold.
const seen = new Set<number>()

let socket: WebSocket | undefined
let retryTimer: ReturnType<typeof setTimeout> | undefined
let retry = 0

function record(line: LogLine) {
	if (seen.has(line.seq)) return false

	seen.add(line.seq)
	buffer.push(line)

	if (buffer.length > MAX_LINES) {
		const dropped = buffer.splice(0, buffer.length - MAX_LINES)
		for (const entry of dropped) seen.delete(entry.seq)
	}

	return true
}

async function connect() {
	// The websocket needs the CSRF token the backend minted at startup
	let token: string
	try {
		token = (await api<{token: string}>('/ws/token')).token
	} catch {
		scheduleReconnect()
		return
	}

	socket = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/logs?token=${token}`)

	socket.onopen = () => {
		retry = 0
		for (const handler of subscribers) handler.onOpen?.()
	}

	socket.onmessage = (event) => {
		try {
			const line: LogLine = JSON.parse(event.data)
			if (!record(line)) return
			for (const handler of subscribers) handler.onLine(line)
		} catch {
			// ignore malformed frames
		}
	}

	socket.onclose = () => {
		for (const handler of subscribers) handler.onClose?.()
		// Only keep trying while something is listening
		if (subscribers.size > 0) scheduleReconnect()
	}

	socket.onerror = () => socket?.close()
}

function scheduleReconnect() {
	clearTimeout(retryTimer)
	// Back off up to ~10s between attempts
	const delay = Math.min(1000 * 2 ** retry++, 10_000)
	retryTimer = setTimeout(() => void connect(), delay)
}

// Subscribe to the log stream. Returns an unsubscribe function.
export function subscribeToLogs(handlers: Handlers): () => void {
	subscribers.add(handlers)

	// Hand over whatever we already have so a late subscriber is not blank
	handlers.onBacklog(buffer.slice())

	// First subscriber opens the socket
	if (!socket) void connect()
	else if (socket.readyState === WebSocket.OPEN) handlers.onOpen?.()

	return () => {
		subscribers.delete(handlers)

		// Last one out closes the socket, so a backgrounded tab stops streaming
		if (subscribers.size === 0) {
			clearTimeout(retryTimer)
			retry = 0
			const closing = socket
			socket = undefined
			closing?.close()
		}
	}
}
