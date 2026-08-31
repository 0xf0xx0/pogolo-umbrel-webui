import {formatDistanceToNowStrict} from 'date-fns'

import {usePoolInfo} from '@/hooks/usePogolo'
import {formatDifficulty} from '@/lib/formatPool'

// Blocks this pool has found. Newest first.
export default function FoundBlocks() {
	const {data, isLoading} = usePoolInfo()

	const blocks = [...(data?.blocksFound ?? [])].sort((a, b) => b.height - a.height)

	if (isLoading) {
		return <div className='h-[120px] flex items-center px-4 text-white/40 text-[13px]'>Loading…</div>
	}

	if (blocks.length === 0) {
		return (
			<div className='h-[120px] flex flex-col justify-center px-4'>
				<span className='text-white/60 text-[14px]'>No blocks yet!</span>
				<span className='text-white/40 text-[12px] mt-1'>Blocks your pool mines will show up here.</span>
			</div>
		)
	}

	return (
		<div className='flex gap-3 px-4 py-2'>
			{blocks.map((block) => (
				<div
					key={block.hash}
					className='shrink-0 w-[180px] rounded-2xl bg-stone-900/40 border-white/10 border-[0.5px] p-3 flex flex-col gap-1'
				>
					<span className='text-white text-[15px] font-[500]'>{block.height.toLocaleString()}</span>
					<span className='text-white/50 text-[12px]'>
						{formatDistanceToNowStrict(new Date(block.timestamp * 1000), {addSuffix: true})}
					</span>
					<span className='text-white/50 text-[12px] truncate' title={block.gopher}>
						by {block.gopher}
					</span>
					<span className='text-white/40 text-[11px]'>diff {Object.values(formatDifficulty(block.difficulty)).join('')}</span>
				</div>
			))}
		</div>
	)
}
