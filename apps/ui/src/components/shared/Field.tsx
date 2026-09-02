import {useState} from 'react'
import {Copy} from 'lucide-react'
import copy from 'copy-to-clipboard'

import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {cn} from '@/lib/utils'

// Semantic tones a value can carry. Named by meaning rather than colour so a
// palette change never means editing call sites.
export type Tone = 'default' | 'muted' | 'accent' | 'highlight' | 'good' | 'warn' | 'bad'

const VALUE_TONE: Record<Tone, string> = {
	default: 'text-body',
	muted: 'text-body-muted',
	accent: 'text-accent',
	highlight: 'text-highlight',
	good: 'text-good',
	warn: 'text-warn',
	bad: 'text-bad',
}

// Dimmed companion for a value's unit/suffix, matched to its tone.
const UNIT_TONE: Record<Tone, string> = {
	default: 'text-body-subtle',
	muted: 'text-body-faint',
	accent: 'text-accent-muted',
	highlight: 'text-highlight-muted',
	good: 'text-good/50',
	warn: 'text-warn/50',
	bad: 'text-bad/50',
}

// A labelled value. `unit` is rendered dimmed beside the value so numbers line
// up regardless of suffix, and `title` carries the raw value on hover.
export function Field({
	label,
	value,
	unit,
	tone = 'default',
	title,
	className,
}: {
	label: string
	value: React.ReactNode
	unit?: string
	tone?: Tone
	title?: string
	className?: string
}) {
	return (
		<div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
			<span className='text-body-faint text-[11px] font-[400]'>{label}</span>
			<span className={cn('text-[13px] font-[400] truncate', VALUE_TONE[tone])} title={title}>
				{value}
				{unit && <span className={cn('ml-0.5', UNIT_TONE[tone])}>{unit}</span>}
			</span>
		</div>
	)
}

// A value split into coloured segments, for pairs like accepted/rejected shares
// where each half needs its own tone. Segments are joined by `separator`.
export function SplitField({
	label,
	segments,
	separator = ' / ',
	title,
	className,
}: {
	label: string
	segments: {value: React.ReactNode; tone?: Tone}[]
	separator?: string
	title?: string
	className?: string
}) {
	return (
		<div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
			<span className='text-body-faint text-[11px] font-[400]'>{label}</span>
			<span className='text-[13px] font-[400] truncate' title={title}>
				{segments.map((segment, index) => (
					<span key={index}>
						{index > 0 && <span className='text-body-faint'>{separator}</span>}
						<span className={VALUE_TONE[segment.tone ?? 'default']}>{segment.value}</span>
					</span>
				))}
			</span>
		</div>
	)
}

// A label and value on one row, with a copy button. Used for connection details
// the user needs to paste into a miner.
export function CopyRow({
	label,
	value,
	tone = 'muted',
	className,
}: {
	label: string
	value?: string
	tone?: Tone
	className?: string
}) {
	const blank = !value // true when no data
	const [open, setOpen] = useState(false)

	const handleCopy = () => {
		// return early if we have nothing to copy
		if (blank) return

		copy(value as string)
		setOpen(true)
		setTimeout(() => setOpen(false), 600)
	}

	return (
		<div className={cn('h-[42px] grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 text-sm', className)}>
			<span className='shrink-0 text-body'>{label}</span>

			<div className='flex min-w-0 items-center justify-end gap-2'>
				{/* show an em-dash when no data */}
				<span
					className={cn('min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-normal', VALUE_TONE[tone])}
					title={value}
				>
					{value || '—'}
				</span>

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							onClick={handleCopy}
							disabled={blank} // disabled when no data
							className='h-4 w-4 shrink-0 p-0 hover:bg-transparent'
						>
							<Copy className='scale-75 text-body-muted' />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						side='top'
						align='center'
						className='w-auto rounded-md border border-line-strong bg-surface/95 px-2 py-1 text-[12px] text-body'
					>
						Copied!
					</PopoverContent>
				</Popover>
			</div>
		</div>
	)
}

// A large headline figure, used for the pool/client hashrate readouts.
export function BigStat({
	value,
	unit,
	tone = 'default',
	title,
	className,
}: {
	value: React.ReactNode
	unit?: string
	tone?: Tone
	title?: string
	className?: string
}) {
	return (
		<div className={cn('flex items-baseline gap-1', className)} title={title}>
			<span className={cn('text-[20px] font-[500] leading-none', VALUE_TONE[tone])}>{value}</span>
			{unit && <span className={cn('text-[12px] font-[400]', UNIT_TONE[tone])}>{unit}</span>}
		</div>
	)
}
