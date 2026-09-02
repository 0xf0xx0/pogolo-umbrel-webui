import {Info as InfoIcon} from 'lucide-react'

import InsightCard from './InsightsCard'
import InfoDialog from '@/components/shared/InfoDialog'
import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty, formatUptimeSeconds} from '@/lib/formatPool'
import {bestShareDifficulty} from '@/lib/poolStats'

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
			<h3 className='flex items-center gap-1 text-[15px] font-[300] text-body-subtle'>
				{label}
				<InfoDialog
					trigger={<InfoIcon className='w-3 h-3 text-body-faint hover:text-body-muted transition-colors' />}
					title={label}
					description={description || ''}
				/>
			</h3>

			<p className='text-[20px] font-[500] leading-none'>
				<span className='bg-text-gradient bg-clip-text text-transparent'>{value}</span>
				{unit && <span className='ml-1 text-[13px] font-[300] text-body-subtle'>{unit}</span>}
			</p>
		</div>
	)
}

export default function StatSummary() {
	const {data} = usePoolInfo()

	const hashrate = formatHashrate(data?.totalHashrate ?? 0)
	// Found blocks count toward the best share, so this can exceed bestDifficulty
	const difficulty = formatDifficulty(bestShareDifficulty(data))
	const uptimeStr = data && data.uptime > 0 ? formatUptimeSeconds(data.uptime) : '—'

	return (
		<InsightCard className='p-0 overflow-hidden h-[240px] md:h-[120px]'>
			{/* 2×2 on mobile, 1×4 on md+  */}
			<div
				className='
				h-full grid grid-cols-2 md:grid-cols-4
				[&>*:nth-child(4n+1)]:bg-transparent
			[&>*:nth-child(4n+2)]:bg-surface-sunken
			[&>*:nth-child(4n+3)]:bg-surface-sunken
				[&>*:nth-child(4n+4)]:bg-transparent
				md:[&>*:nth-child(odd)]:bg-transparent
			md:[&>*:nth-child(even)]:bg-surface-sunken
				'
			>
				<Stat
					label='Total Hashrate'
					value={hashrate.value}
					unit={hashrate.unit}
					description='The combined hashrate currently connected to pogolo. This is estimated from the shares your gophers submit, so it moves around a little even when they are running at a steady speed.'
				/>
				<Stat
					label='Gophers'
					value={data?.totalGophers ?? 0}
					description='The number of gophers currently connected to pogolo. Each connected device counts as one gopher.'
				/>
				<Stat
					label='Best Share'
					value={difficulty.value || '—'}
					unit={difficulty.unit}
					description={`The highest-difficulty share a gopher connected has produced, including any blocks it has found. A block is found when a share's difficulty is at least the network difficulty.`}
				/>
				<Stat label='Uptime' value={uptimeStr} description='How long pogolo has been running.' />
			</div>
		</InsightCard>
	)
}
