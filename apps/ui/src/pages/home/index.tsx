import {motion, AnimatePresence} from 'framer-motion'

import {Card, CardContent} from '@/components/ui/card'
import {GradientBorderTopBottom, GradientBorderFromCorners} from '@/components/shared/GradientBorders'
import HorizontalFadeScroll from '@/components/shared/HorizontalFadeScroll'
import StatusDot from './StatusDot'
import LogStream from './LogStream'
import PoolStats from './PoolStats'
import FoundBlocks from './FoundBlocks'

import {usePoolStatus, usePoolInfo} from '@/hooks/usePogolo'
import {formatUptimeSeconds} from '@/lib/formatPool'

export default function HomePage() {
	const {data: status, isError, isLoading: isStatusLoading} = usePoolStatus()
	const {data: info} = usePoolInfo()

	const running = !isError && status?.running === true
	const uptime = running && info?.uptime ? formatUptimeSeconds(info.uptime) : null

	return (
		<>
			<Card className='bg-card-gradient backdrop-blur-2xl border-none mb-5 pt-4 pb-0 md:pb-4 rounded-3xl'>
				<GradientBorderTopBottom depth='7%' />
				<CardContent className='flex flex-col md:flex-row px-4 items-center'>
					{/* Live pogolo log output + running status */}
					<div className='relative w-full flex-none md:flex-1 h-64 md:h-[375px] rounded-2xl bg-neutral-900/20 border-white/10 border-[0.5px] overflow-hidden'>
						<GradientBorderFromCorners />

						<LogStream />

						{/* Running status floats above the log output */}
						<AnimatePresence mode='wait'>
							{/* Only show status when we have data (not loading) */}
							{!isStatusLoading && (
								<motion.h3
									// the key prop tells Motion when state flips
									key={running ? 'running' : 'stopped'}
									initial={{opacity: 0}}
									animate={{opacity: 1}}
									exit={{opacity: 0}}
									transition={{duration: 0.25}}
									className='absolute top-[7%] left-[5%] flex items-center gap-1 justify-center pointer-events-none select-none bg-black/40 backdrop-blur-sm rounded-full pl-1 pr-3 py-0.5'
								>
									<StatusDot running={running} />

									{running ? (
										<>
											<span className='text-[#0BC39E] text-[14px] font-[500] ml-1'>Running</span>
											{uptime && <span className='text-white/60 text-[14px] font-[400]'>for {uptime}</span>}
										</>
									) : (
										<span className='text-[#EF4444] text-[14px] font-[500] ml-1'>Not running</span>
									)}
								</motion.h3>
							)}
						</AnimatePresence>
					</div>

					{/* Pool stats - to the right on desktop and below on mobile */}
					<div className='w-full md:w-[215px] flex flex-col items-center mt-4 md:mt-0 pb-7 md:pb-0'>
						<PoolStats />
					</div>
				</CardContent>
			</Card>

			{/* Found blocks — horizontally scrollable on mobile */}
			<div className='w-full mt-4'>
				<span className='text-white/50 text-[14px] font-[400] ml-4'>Blocks Found</span>
				<HorizontalFadeScroll>
					<FoundBlocks />
				</HorizontalFadeScroll>
			</div>
		</>
	)
}
