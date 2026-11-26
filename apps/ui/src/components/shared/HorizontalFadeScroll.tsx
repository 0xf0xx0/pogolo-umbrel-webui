// Horizontal scroll container with fade hints on left/right edges
// and hidden scrollbar for a cleaner look

import * as React from 'react'
import {cn} from '@/lib/utils'

type Props = {
	className?: string
	children: React.ReactNode
	fadeColor?: string // hex color for fade gradient (defaults to black)
}

export default function HorizontalFadeScroll({className, children, fadeColor = 'var(--background)'}: Props) {
	const scrollRef = React.useRef<HTMLDivElement | null>(null)
	const [showLeft, setShowLeft] = React.useState(false)
	const [showRight, setShowRight] = React.useState(false)
	const activePointer = React.useRef<number | null>(null)
	const dragStartX = React.useRef(0)
	const dragged = React.useRef(false)

	const update = React.useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const EPS = 1
		setShowLeft(el.scrollLeft > EPS)
		setShowRight(el.scrollWidth - el.clientWidth - el.scrollLeft > EPS)
	}, [])

	const dragStart = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
		activePointer.current = event.pointerId
		dragStartX.current = event.clientX
		dragged.current = false
	}

	const drag = (event: React.PointerEvent<HTMLDivElement>) => {
		if (activePointer.current !== event.pointerId) return
		if (!dragged.current && Math.abs(event.clientX - dragStartX.current) <= 5) return

		const el = event.currentTarget
		if (!dragged.current) {
			// Capturing on pointerdown retargets ordinary link clicks to the scroll
			// container. Wait until this is actually a drag before capturing.
			dragged.current = true
			el.setPointerCapture(event.pointerId)
		}
		el.scrollLeft -= event.movementX
	}

	const dragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
		if (activePointer.current !== event.pointerId) return
		activePointer.current = null
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}
	}

	const dragCancel = (event: React.PointerEvent<HTMLDivElement>) => {
		dragged.current = false
		dragEnd(event)
	}

	// A drag ending over a link should scroll, not navigate.
	const suppressDragClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!dragged.current) return
		event.preventDefault()
		event.stopPropagation()
		dragged.current = false
	}

	React.useLayoutEffect(update, [update])

	React.useEffect(() => {
		const el = scrollRef.current
		if (!el) return
		el.addEventListener('scroll', update, {passive: true})
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => {
			el.removeEventListener('scroll', update)
			ro.disconnect()
		}
	}, [update])

	return (
		<div className='relative'>
			<div
				ref={scrollRef}
				className={cn(
					'overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none',
					// Hide scrollbar
					'scrollbar-none [&::-webkit-scrollbar]:hidden',
					className,
				)}
				onPointerDown={dragStart}
				onPointerMove={drag}
				onPointerUp={dragEnd}
				onPointerCancel={dragCancel}
				onClickCapture={suppressDragClick}
				onDragStart={(event) => event.preventDefault()}
			>
				{children}
			</div>

			{/* Left fade hint */}
			{showLeft && (
				<div
					className='pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24'
					style={{
						background: `linear-gradient(to right, ${fadeColor} 0%, transparent 100%)`,
					}}
				/>
			)}

			{/* Right fade hint */}
			{showRight && (
				<div
					className='pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24'
					style={{
						background: `linear-gradient(to left, ${fadeColor} 0%, transparent 100%)`,
					}}
				/>
			)}
		</div>
	)
}
