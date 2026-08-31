import {Info as InfoIcon} from 'lucide-react'

import InsightCard from './InsightsCard'
import InfoDialog from '@/components/shared/InfoDialog'
import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty, formatUptimeSeconds} from '@/lib/formatPool'

function Stat({
	label,
	value,
	unit,
	description,
}: {
	label: string
	value: React.ReactNode
	unit?: string
	description?: string
}) {
	return (
		<div className='flex flex-col items-center justify-center gap-2 py-6'>
			<h3 className='flex items-center gap-1 font-bold text-[15px] font-[300] text-white/30'>
				{label}
				<InfoDialog
					trigger={<InfoIcon className='w-3 h-3 text-white/30 hover:text-white/60 transition-colors' />}
					title={label}
					description={description || ''}
				/>
			</h3>

			<p className='font-bold text-[20px] font-[500] leading-none'>
				<span className='bg-text-gradient bg-clip-text text-transparent'>{value}</span>
				{unit && <span className='ml-1 text-[13px] font-[300] text-white/50'>{unit}</span>}
			</p>
		</div>
	)
}

export default function StatSummary() {
	const {data} = usePoolInfo()

    const hashrate = formatHashrate(data?.totalHashrate ?? 0)
	const difficulty = formatDifficulty(data?.bestDifficulty ?? 0)
	const uptimeStr = data && data.uptime > 0 ? formatUptimeSeconds(data.uptime) : '—'

	return (
		<InsightCard className='p-0 overflow-hidden h-[240px] md:h-[120px]'>
			{/* 2×2 on mobile, 1×4 on md+  */}
			<div
				className='
				h-full grid grid-cols-2 md:grid-cols-4
				[&>*:nth-child(4n+1)]:bg-transparent
			[&>*:nth-child(4n+2)]:bg-white/5
			[&>*:nth-child(4n+3)]:bg-white/5
				[&>*:nth-child(4n+4)]:bg-transparent
				md:[&>*:nth-child(odd)]:bg-transparent
			md:[&>*:nth-child(even)]:bg-white/5
				'
			>
				<Stat
					label='Hashrate'
					value={hashrate.value}
					unit={hashrate.unit}
					description='The combined hashrate of every miner currently connected to your pool. This is estimated from the shares your miners submit, so it moves around a little even when your miners are running at a steady speed.'
				/>
				<Stat
					label='Gophers'
					value={data?.totalGophers ?? 0}
					unit=''
					description='The number of miners currently connected to your pool. Each connected device counts as one gopher.'
				/>
				<Stat
					label='Best Share'
					value={difficulty.value}
					unit={difficulty.unit}
					description={`The highest-difficulty share any of your miners has submitted. A block is found when a share's difficulty is at least the network difficulty, so this is how close your pool has come to finding a block.`}
				/>
				<Stat
					label='Pool Uptime'
					value={uptimeStr}
					description='How long pogolo has been running since it last restarted.'
				/>
			</div>
		</InsightCard>
	)
}
