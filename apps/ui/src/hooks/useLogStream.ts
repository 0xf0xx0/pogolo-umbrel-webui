import {useEffect, useRef, useState} from 'react'

import {useWebSocketToken} from './useWebSocketToken'

import type {LogLine} from '#types'

// Lines kept in the browser. The backend replays its own recent history on
// connect, so this only needs to bound growth during a long session.
const MAX_LINES = 500

// Live pogolo log output. The backend converts ANSI colour codes to HTML spans
// and escapes the text, so `html` is safe to render.
export function useLogStream() {
	const [lines, setLines] = useState<LogLine[]>([])
	const [connected, setConnected] = useState(false)
	const {data: tokenData} = useWebSocketToken()

	// Track seen sequence numbers so a reconnect (which replays history) does not
	// duplicate lines already on screen.
	const seenSeq = useRef(new Set<number>())

	useEffect(() => {
		if (!tokenData?.token) return

		let socket: WebSocket | undefined
		let retryTimer: ReturnType<typeof setTimeout> | undefined
		let retry = 0
		let cancelled = false

		const open = () => {
			socket = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/ws/logs?token=${tokenData.token}`)

			socket.onopen = () => {
				retry = 0
				setConnected(true)
			}

			socket.onmessage = (event) => {
				try {
					const line: LogLine = JSON.parse(event.data)

					if (seenSeq.current.has(line.seq)) return
					seenSeq.current.add(line.seq)

					setLines((previous) => {
						const next = [...previous, line]
						if (next.length <= MAX_LINES) return next

						const trimmed = next.slice(next.length - MAX_LINES)
						// Forget sequence numbers we no longer display
						seenSeq.current = new Set(trimmed.map((l) => l.seq))
						return trimmed
					})
				} catch {
					// ignore malformed frames
				}
			}

			socket.onclose = () => {
				setConnected(false)
				if (cancelled) return
				// Back off up to ~10s between reconnect attempts
				const delay = Math.min(1000 * 2 ** retry++, 10_000)
				retryTimer = setTimeout(open, delay)
			}

			socket.onerror = () => socket?.close()
		}

		open()

		return () => {
			cancelled = true
			clearTimeout(retryTimer)
			socket?.close()
		}
	}, [tokenData?.token])

	return {lines, connected}
}
