import clsx from 'clsx'
import {cn} from '@/lib/utils'

// We import SVGs as React components via `?react` (SVGR):
// This inlines the <svg>, so there's no extra HTTP request.
// It also gives us the same behaviors as normal DOM elements—easy to size, recolor, and animate.
import Logo from '@/assets/logo.svg?react'

import ConnectionDetails from '@/components/ConnectionDetails'
import {usePoolInfo} from '@/hooks/usePogolo'

export default function Header({className}: {className?: string}) {
	const {data: info, isLoading, isError} = usePoolInfo()

	// placeholder text to prevent layout shift and fall back on error
	const placeholder = 'getting coinbase tag...'

	return (
		<header className={cn('flex items-end md:items-center justify-between mb-6 md:mb-8 w-full', className)}>
			<div className='flex flex-row items-center gap-2.5 md:gap-3.5'>
				<Logo aria-label='pogolo logo' className='w-[50px] md:w-[60px] h-[50px] md:h-[60px] shrink-0' />
				<div>
					<h1 className='text-[22px] md:text-[28px] font-bold bg-text-gradient bg-clip-text text-transparent leading-none pb-1'>
						pogolo
					</h1>

					{/* We gracefully handle loading and error states for no layout shift */}
					<p className='text-[14px] md:text-[16px] leading-none font-[400] text-white/35'>
						<span
							className={clsx(
								'inline-block transition-opacity duration-500 ease-in-out truncate max-w-[200px] md:max-w-[360px] font-fix',
								isLoading ? 'opacity-0 select-none' : 'opacity-100',
							)}
							title={info?.tag}
						>
							{isLoading || isError || !info?.tag ? placeholder : info.tag}
						</span>
					</p>
				</div>
			</div>
			<div>
				{/* Connect button + modal */}
				<ConnectionDetails />
			</div>
		</header>
	)
}
