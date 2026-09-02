import {useEffect, useRef, useState} from 'react'

import {subscribeToLogs, MAX_LINES} from '@/lib/logStream'

// Live pogolo output.
//
// Log lines are append-only, so React never re-renders the list: each new line
// is appended as a DOM node and old ones are dropped off the front. Re-rendering
// hundreds of dangerouslySetInnerHTML nodes on every incoming line was enough to
// make the pane stutter under a busy log.
export default function LogStream() {
	const viewportRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLDivElement>(null)

	// Whether the pane is empty / still connecting, for the placeholder only.
	// This is the one piece of state React needs to track.
	const [status, setStatus] = useState<'connecting' | 'empty' | 'streaming'>('connecting')

	// Pinning is read from the DOM at append time rather than held in state, so
	// scrolling never triggers a render.
	const pinnedRef = useRef(true)

	useEffect(() => {
		const append = (html: string) => {
			const list = listRef.current
			const viewport = viewportRef.current
			if (!list || !viewport) return

			const row = document.createElement('div')
			row.className = 'whitespace-pre-wrap break-all'
			// The backend escapes all log text before adding its own markup
			row.innerHTML = html
			list.appendChild(row)

			// Bound the DOM the same way the buffer is bounded
			while (list.childElementCount > MAX_LINES) {
				list.removeChild(list.firstChild as ChildNode)
			}

			if (pinnedRef.current) viewport.scrollTop = viewport.scrollHeight
		}

		return subscribeToLogs({
			// Replay of buffered history on (re)connect
			onBacklog: (lines) => {
				const list = listRef.current
				if (!list) return
				list.replaceChildren()
				for (const line of lines) append(line.html)
				setStatus(lines.length > 0 ? 'streaming' : 'empty')
			},
			onLine: (line) => {
				append(line.html)
				setStatus('streaming')
			},
			onOpen: () => setStatus((current) => (current === 'connecting' ? 'empty' : current)),
			onClose: () => setStatus((current) => (current === 'streaming' ? current : 'connecting')),
		})
	}, [])

	const onScroll = () => {
		const el = viewportRef.current
		if (!el) return
		// Treat "within a few pixels of the bottom" as pinned, so rounding during
		// smooth scrolling does not unpin the view.
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
		pinnedRef.current = distanceFromBottom < 24
	}

	return (
		<div
			ref={viewportRef}
			onScroll={onScroll}
			className='ansi-log absolute inset-0 overflow-y-auto overflow-x-hidden px-4 pt-11 pb-4 font-mono text-[11px] leading-[1.5] text-body-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
		>
			{status !== 'streaming' && (
				<p className='text-body-subtle'>
					{status === 'connecting' ? 'Connecting to log stream…' : 'Waiting for output…'}
				</p>
			)}
			<div ref={listRef} />
		</div>
	)
}
