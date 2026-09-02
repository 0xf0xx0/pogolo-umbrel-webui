import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'

import InsightCard from './InsightsCard'
import {CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {api} from '@/lib/api'
import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate} from '@/lib/formatPool'

import type {MetricHistory} from '#types'

// The pool total is stored under this reserved series id by the backend.
const POOL_SERIES = 'pool'

// Series colours. Chosen to stay distinguishable for the common forms of colour
// blindness: they differ in lightness as well as hue, and avoid a red/green
// pairing. The pool total is always the first (lightest) colour.
const SERIES_COLORS = [
	'var(--color-cyan-400)',
	'var(--color-blue-400)',
	'var(--color-amber-400)',
	'var(--color-violet-400)',
	'var(--color-teal-400)',
	'var(--color-orange-400)',
	'var(--color-sky-300)',
	'var(--color-fuchsia-400)',
]

// Dashed strokes give each series a second, non-colour cue.
const SERIES_DASHES = ['0', '0', '5 3', '2 3', '8 3', '5 3 2 3', '3 2', '1 3']

const VIEW_WIDTH = 720
const VIEW_HEIGHT = 180

type Series = {
	id: string
	label: string
	color: string
	dash: string
	// One value per sample, null where the series had no data
	values: (number | null)[]
}

function buildPath(values: (number | null)[], max: number, count: number): string {
	if (count < 2) return ''

	const x = (index: number) => (index / (count - 1)) * VIEW_WIDTH
	// Leave a little headroom so the peak is not flush with the top edge
	const y = (value: number) => VIEW_HEIGHT - (value / max) * (VIEW_HEIGHT * 0.92)

	let path = ''
	let penDown = false

	for (const [index, value] of values.entries()) {
		if (value === null) {
			// Break the line where the series has no data rather than interpolating
			penDown = false
			continue
		}
		path += `${penDown ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)} `
		penDown = true
	}

	return path.trim()
}

export default function HashrateChart() {
	const {data: info} = usePoolInfo()

	const {data: history, isLoading} = useQuery({
		queryKey: ['pool', 'history'],
		queryFn: () => api<MetricHistory>('/pool/history'),
		refetchInterval: 10_000,
	})

	const {series, max, count} = useMemo(() => {
		// Map a gopher id to a readable label, preferring its user agent
		const labelFor = (id: string) => {
			if (id === POOL_SERIES) return 'Pool total'
			const gopher = info?.gophers.find((g) => g.extranonce1 === id)
			return gopher?.userAgent ? `${gopher.userAgent} (${id})` : id
		}

		const samples = history?.samples ?? []
		if (samples.length === 0) return {series: [] as Series[], max: 0, count: 0}

		// Every series that appears anywhere in the window, pool first
		const ids = new Set<string>()
		for (const sample of samples) for (const id of Object.keys(sample.hashrate)) ids.add(id)
		ids.delete(POOL_SERIES)
		const ordered = [POOL_SERIES, ...[...ids].sort()]

		let peak = 0
		const built: Series[] = ordered.map((id, index) => {
			const values = samples.map((sample) => {
				const value = sample.hashrate[id]
				if (value === undefined) return null
				peak = Math.max(peak, value)
				return value
			})

			return {
				id,
				label: labelFor(id),
				color: SERIES_COLORS[index % SERIES_COLORS.length] as string,
				dash: SERIES_DASHES[index % SERIES_DASHES.length] as string,
				values,
			}
		})

		return {series: built, max: peak, count: samples.length}
	}, [history, info])

	const peakLabel = formatHashrate(max)

	// A single sample cannot be drawn as a line
	const hasCurve = count >= 2 && max > 0

	return (
		<InsightCard>
			<CardHeader>
				<CardTitle className='text-body text-[20px] font-[400]'>Hashrate</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className='text-body-subtle text-[14px]'>Loading…</p>
				) : !hasCurve ? (
					<div className='flex flex-col gap-1 py-4'>
						<span className='text-body-muted text-[14px]'>Not enough history yet</span>
						<span className='text-body-subtle text-[12px]'>
							The chart fills in as your pool runs; check back in a minute.
						</span>
					</div>
				) : (
					<div className='flex flex-col gap-3'>
						<div className='relative'>
							{/* Peak marker, so the vertical scale is readable */}
							<span className='absolute top-0 left-0 text-body-faint text-[11px]'>
								{peakLabel.value} {peakLabel.unit}
							</span>

							<svg
								viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
								preserveAspectRatio='none'
								className='w-full h-[180px] overflow-visible'
								role='img'
								aria-label='Hashrate over time, pool total and each connected miner'
							>
								{series.map((s) => (
									<path
										key={s.id}
										d={buildPath(s.values, max, count)}
										fill='none'
										stroke={s.color}
										strokeDasharray={s.dash}
										strokeWidth={s.id === POOL_SERIES ? 2 : 1.25}
										strokeLinejoin='round'
										strokeLinecap='round'
										vectorEffect='non-scaling-stroke'
									/>
								))}
							</svg>
						</div>

						{/* Legend pairs each colour with its dash pattern and label */}
						<div className='flex flex-wrap gap-x-4 gap-y-1'>
							{series.map((s) => (
								<span key={s.id} className='flex items-center gap-1.5 min-w-0'>
									<svg width='18' height='6' aria-hidden className='shrink-0'>
										<line
											x1='0'
											y1='3'
											x2='18'
											y2='3'
											stroke={s.color}
											strokeDasharray={s.dash}
											strokeWidth={s.id === POOL_SERIES ? 2 : 1.25}
										/>
									</svg>
									<span className='text-body-subtle text-[11px] truncate' title={s.label}>
										{s.label}
									</span>
								</span>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</InsightCard>
	)
}
