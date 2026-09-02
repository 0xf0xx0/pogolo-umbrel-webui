import {formatDistanceToNowStrict} from 'date-fns'

import {usePoolInfo} from '@/hooks/usePogolo'
import {useExplorer} from '@/hooks/useExplorer'
import {formatDifficulty} from '@/lib/formatPool'

// Blocks this pool has found. Newest first.
export default function FoundBlocks() {
	const {data, isLoading} = usePoolInfo()
	const {blockUrl} = useExplorer()

	const blocks = [...(data?.blocksFound ?? [])].sort((a, b) => b.height - a.height)

	if (isLoading) {
		return <div className='h-[120px] flex items-center px-4 text-body-subtle text-[13px]'>Loading…</div>
	}

	if (blocks.length === 0) {
		return (
			<div className='h-[120px] flex flex-col justify-center px-4'>
				<span className='text-body-muted text-[14px]'>No blocks yet!</span>
				<span className='text-body-subtle text-[12px] mt-1'>Blocks your pool mines will show up here.</span>
			</div>
		)
	}

	return (
		<div className='flex gap-3 px-4 py-2'>
			{blocks.map((block) => {
				const difficulty = formatDifficulty(block.difficulty)
				const href = blockUrl(block.hash)

				const height = block.height.toLocaleString()

				return (
					<div
						key={block.hash}
						className='shrink-0 w-[180px] rounded-2xl bg-surface-raised border-line border-[0.5px] p-3 flex flex-col gap-1'
					>
						{/* Only a link when an explorer is configured */}
						{href ? (
							<a
								href={href}
								target='_blank'
								rel='noreferrer'
								title={`View block ${height} in the explorer`}
								className='text-highlight hover:underline text-[15px] font-[500] w-fit'
							>
								{height}
							</a>
						) : (
							<span className='text-body text-[15px] font-[500]'>{height}</span>
						)}

						<span className='text-body-subtle text-[12px]'>
							{formatDistanceToNowStrict(new Date(block.timestamp * 1000), {addSuffix: true})}
						</span>
						<span className='text-body-subtle text-[12px] truncate' title={block.gopher}>
							by {block.gopher}
						</span>
						<span className='text-body-faint text-[11px]' title={String(block.difficulty)}>
							diff {difficulty.value}
							{difficulty.unit}
						</span>
					</div>
				)
			})}
		</div>
	)
}
