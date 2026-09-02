import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty} from '@/lib/formatPool'
import {bestShareDifficulty} from '@/lib/poolStats'
import type {Tone} from '@/components/shared/Field'
import {cn} from '@/lib/utils'

const TONE: Record<string, string> = {
	accent: 'text-accent',
	highlight: 'text-highlight',
	default: 'text-body',
}

function Stat({label, value, unit, tone = 'default'}: {label: string; value: string; unit?: string; tone?: Tone}) {
	return (
		<div className='flex flex-col items-center'>
			<span className='text-body-subtle text-[12px] font-[400]'>{label}</span>
			<span className={cn('text-[22px] font-[500] leading-tight', TONE[tone] ?? TONE['default'])}>
				{value}
				{unit && <span className='text-body-subtle text-[13px] font-[400] ml-1'>{unit}</span>}
			</span>
		</div>
	)
}

export default function PoolStats() {
	const {data} = usePoolInfo()

	const hashrate = formatHashrate(data?.totalHashrate ?? 0)
	// Found blocks count toward the best share, so this can exceed bestDifficulty
	const difficulty = formatDifficulty(bestShareDifficulty(data))

	return (
		<div className='w-full flex flex-col gap-5 py-2'>
			<Stat label='Total Hashrate' value={hashrate.value || '—'} unit={hashrate.unit} tone='accent' />
			<Stat label='Gophers' value={(data?.totalGophers ?? 0).toLocaleString()} />
			<Stat label='Best Share' value={difficulty.value || '—'} unit={difficulty.unit} tone='highlight' />
			<Stat label='Height' value={data?.blockHeight?.toLocaleString() ?? '—'} />
		</div>
	)
}
