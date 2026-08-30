import {useEffect, useRef, useState} from 'react'

import {useLogStream} from '@/hooks/useLogStream'

// Live pogolo output. The backend has already escaped the text and converted
// ANSI colour codes into <span class="ansi-*"> wrappers, so this renders the
// prepared HTML directly.
export default function LogStream() {
	const {lines, connected} = useLogStream()
	const viewportRef = useRef<HTMLDivElement>(null)

	// Stay pinned to the newest line unless the user has scrolled up to read back
	const [pinned, setPinned] = useState(true)

	useEffect(() => {
		const el = viewportRef.current
		if (!el || !pinned) return
		el.scrollTop = el.scrollHeight
	}, [lines, pinned])

	const onScroll = () => {
		const el = viewportRef.current
		if (!el) return
		// Treat "within a few pixels of the bottom" as pinned, so rounding during
		// smooth scrolling does not unpin the view.
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
		setPinned(distanceFromBottom < 24)
	}

	return (
		<div
			ref={viewportRef}
			onScroll={onScroll}
			className='ansi-log absolute inset-0 overflow-y-auto overflow-x-hidden px-4 pt-11 pb-4 font-mono text-[11px] leading-[1.5] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
		>
			{lines.length === 0 ? (
				<p className='text-white/40'>{connected ? 'Waiting for output…' : 'Connecting to log stream…'}</p>
			) : (
				lines.map((line) => (
					// The backend escapes all log text before adding its own markup
					<div
						key={line.seq}
						className='whitespace-pre-wrap break-all text-white/70'
						dangerouslySetInnerHTML={{__html: line.html}}
					/>
				))
			)}
		</div>
	)
}
