import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty} from '@/lib/formatPool'

function Stat({label, value, unit}: {label: string; value: string; unit?: string}) {
	return (
		<div className='flex flex-col items-center'>
			<span className='text-white/50 text-[12px] font-[400]'>{label}</span>
			<span className='text-white text-[22px] font-[500] leading-tight'>
				{value}
				{unit && <span className='text-white/60 text-[13px] font-[400] ml-1'>{unit}</span>}
			</span>
		</div>
	)
}

export default function PoolStats() {
	const {data} = usePoolInfo()

    const hashrate = formatHashrate(data?.totalHashrate ?? 0)
	const difficulty = formatDifficulty(data?.bestDifficulty ?? 0)

	return (
		<div className='w-full flex flex-col gap-5 py-2'>
			<Stat label='Hashrate' value={hashrate.value} unit={hashrate.unit} />
			<Stat label='Gophers' value={(data?.totalGophers ?? 0).toLocaleString()} />
			<Stat label='Best Share' value={difficulty.value} unit={difficulty.unit} />
			<Stat label='Height' value={(data?.blockHeight ?? 0).toLocaleString()} />
		</div>
	)
}
