import {useEffect, useMemo, useRef, useState} from 'react'
import type {PointerEvent as ReactPointerEvent} from 'react'
import {useQuery} from '@tanstack/react-query'

import InsightCard from './InsightsCard'
import {CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {api} from '@/lib/api'
import {formatHashrate} from '@/lib/formatPool'

import type {MetricHistory} from '#types'

// The pool total is stored under this reserved series id by the backend.
const POOL_SERIES = 'pool'
const NICKNAME_SERIES_PREFIX = 'nickname:'
const ID_SERIES_PREFIX = 'id:'

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
const PLOT_TOP = 12
const PLOT_BOTTOM = VIEW_HEIGHT - 12
const TICK_COUNT = 5

type Series = {
	id: string
	label: string
	color: string
	dash: string
	// One value per sample, null where the series had no data
	values: (number | null)[]
}

type LogDomain = {
	min: number
	max: number
}

type ActiveSample = {
	timestamp: number
	x: number
	y: number
	points: {
		seriesId: string
		label: string
		color: string
		value: number | null
	}[]
}

function yFor(value: number, domain: LogDomain): number {
	const position = (Math.log(value) - Math.log(domain.min)) / (Math.log(domain.max) - Math.log(domain.min))
	return PLOT_BOTTOM - position * (PLOT_BOTTOM - PLOT_TOP)
}

function buildTicks(domain: LogDomain) {
	const logMin = Math.log(domain.min)
	const logMax = Math.log(domain.max)

	return Array.from({length: TICK_COUNT}, (_, index) => {
		const position = index / (TICK_COUNT - 1)
		const formatted = formatHashrate(Math.exp(logMax - position * (logMax - logMin)))
		return {
			y: PLOT_TOP + position * (PLOT_BOTTOM - PLOT_TOP),
			label: `${formatted.value} ${formatted.unit}`,
		}
	})
}

function buildPath(values: (number | null)[], domain: LogDomain, count: number): string {
	if (count < 2) return ''

	const x = (index: number) => (index / (count - 1)) * VIEW_WIDTH

	let path = ''
	let penDown = false

	for (const [index, value] of values.entries()) {
		if (value === null || value <= 0) {
			// Break the line where the series has no data. Zero cannot be shown on a
			// logarithmic scale, so it is a gap too.
			penDown = false
			continue
		}
		path += `${penDown ? 'L' : 'M'}${x(index).toFixed(1)} ${yFor(value, domain).toFixed(1)} `
		penDown = true
	}

	return path.trim()
}

export default function HashrateChart() {
	const {data: history, isLoading} = useQuery({
		queryKey: ['pool', 'history'],
		queryFn: () => api<MetricHistory>('/pool/history'),
		refetchInterval: 10_000,
	})

	const {series, domain, count} = useMemo(() => {
		// Names are part of the series id, so they remain available after a disconnect.
		const labelFor = (id: string) => {
			if (id === POOL_SERIES) return 'Total'
			if (id.startsWith(NICKNAME_SERIES_PREFIX)) return id.slice(NICKNAME_SERIES_PREFIX.length)
			if (id.startsWith(ID_SERIES_PREFIX)) return id.slice(ID_SERIES_PREFIX.length)
			return id
		}

		const samples = history?.samples ?? []
		if (samples.length === 0) return {series: [] as Series[], domain: null, count: 0}

		// Every series that appears anywhere in the window, pool first
		const ids = new Set<string>()
		for (const sample of samples) for (const id of Object.keys(sample.hashrate)) ids.add(id)
		ids.delete(POOL_SERIES)
		const ordered = [POOL_SERIES, ...[...ids].sort()]

		let peak = 0
		let minimum = Infinity
		const built: Series[] = ordered.map((id, index) => {
			const values = samples.map((sample) => {
				const value = sample.hashrate[id]
				if (value === undefined || !Number.isFinite(value)) return null
				if (value > 0) {
					peak = Math.max(peak, value)
					minimum = Math.min(minimum, value)
				}
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

		// A flat history still needs a non-zero log domain. Otherwise, use the
		// actual extremes so small clients remain visible beside much larger ones.
		const domain: LogDomain | null =
			peak > 0 && Number.isFinite(minimum)
				? {
						min: peak === minimum ? minimum / 10 : minimum,
						max: peak === minimum ? peak * 10 : peak,
					}
				: null

		return {series: built, domain, count: samples.length}
	}, [history])

	const [activeSample, setActiveSample] = useState<ActiveSample | null>(null)
	const chartRef = useRef<HTMLDivElement>(null)
	const ticks = domain ? buildTicks(domain) : []

	useEffect(() => {
		const dismissOnOutsidePointer = (event: PointerEvent) => {
			if (!event.target || !chartRef.current?.contains(event.target as Node)) setActiveSample(null)
		}

		document.addEventListener('pointerdown', dismissOnOutsidePointer)
		return () => document.removeEventListener('pointerdown', dismissOnOutsidePointer)
	}, [])

	const showValues = (event: ReactPointerEvent<SVGSVGElement>) => {
		if (count < 2) return
		const bounds = event.currentTarget.getBoundingClientRect()
		if (bounds.width === 0 || bounds.height === 0) return

		const position = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
		const sampleIndex = Math.round(position * (count - 1))
		const timestamp = history?.samples[sampleIndex]?.timestamp
		if (timestamp === undefined) return

		setActiveSample({
			timestamp,
			x: (sampleIndex / (count - 1)) * 100,
			y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)) * VIEW_HEIGHT,
			points: series.map((s) => ({
				seriesId: s.id,
				label: s.label,
				color: s.color,
				value: s.values[sampleIndex] ?? null,
			})),
		})
	}

	const hideValue = (event: ReactPointerEvent<SVGSVGElement>) => {
		// Touch pointers leave the SVG immediately after a tap; keep that tooltip
		// visible until the chart is tapped again.
		if (event.pointerType !== 'touch') setActiveSample(null)
	}

	return (
		<InsightCard>
			<CardHeader>
				<CardTitle className='text-body text-xl font-normal'>
					Hashrate <span className='text-body-faint text-xs'>log scale</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className='text-body-subtle text-sm'>Loading…</p>
				) : domain === null || count < 2 ? (
					<div className='flex flex-col gap-1 py-4'>
						<span className='text-body-muted text-sm'>Not enough history yet</span>
						<span className='text-body-subtle text-xs'>The chart fills in as pogolo runs; check back in a minute.</span>
					</div>
				) : (
					<div className='flex flex-col gap-3'>
						<div ref={chartRef} className='relative h-50'>
							<svg
								viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
								preserveAspectRatio='none'
								className='w-full h-50 overflow-visible cursor-crosshair touch-pan-y'
								role='img'
								aria-label='Log-scaled hashrate over time, pool total and each connected miner'
								onPointerMove={showValues}
								onPointerDown={showValues}
								onPointerLeave={hideValue}
							>
								{/* Five log-spaced grid lines on md+, reduced to three below md. */}
								{ticks.map((tick, index) => (
									<line
										key={tick.y}
										x1='0'
										x2={VIEW_WIDTH}
										y1={tick.y}
										y2={tick.y}
										stroke='var(--color-line)'
										strokeDasharray='2 4'
										vectorEffect='non-scaling-stroke'
										pointerEvents='none'
										className={index % 2 === 0 ? 'block' : 'hidden md:block'}
									/>
								))}

								{series.map((s) => (
									<path
										key={s.id}
										d={buildPath(s.values, domain, count)}
										fill='none'
										stroke={s.color}
										strokeDasharray={s.dash}
										strokeWidth={s.id === POOL_SERIES ? 2 : 1.25}
										strokeLinejoin='round'
										strokeLinecap='round'
										vectorEffect='non-scaling-stroke'
										pointerEvents='none'
									/>
								))}
							</svg>

							{ticks.map((tick, index) => (
								<span
									key={tick.y}
									className={`absolute left-1 -translate-y-1/2 px-1 text-[10px] leading-4 text-good pointer-events-none ${index % 2 === 0 ? 'block' : 'hidden md:block'}`}
									style={{top: `${(tick.y / VIEW_HEIGHT) * 100}%`}}
								>
									{tick.label}
								</span>
							))}

							{activeSample && (
								<>
									<div
										className='absolute top-0 bottom-0 w-px -translate-x-1/2 bg-line-strong pointer-events-none'
										style={{left: `${activeSample.x}%`}}
									/>
									<div
										className='absolute z-10 w-48 rounded-lg border border-line-strong bg-surface-input/95 px-2.5 py-2 text-xs shadow-lg pointer-events-none'
										style={{
											left: `clamp(96px, ${activeSample.x}%, calc(100% - 96px))`,
											top: `${(activeSample.y / VIEW_HEIGHT) * 100}%`,
											transform:
												activeSample.y < VIEW_HEIGHT * 0.55
													? 'translate(-50%, 12px)'
													: 'translate(-50%, calc(-100% - 12px))',
										}}
									>
										<div className='flex flex-col gap-1'>
											{activeSample.points.map((point) => {
												const hashrate = point.value === null ? null : formatHashrate(point.value)
												return (
													<div key={point.seriesId} className='flex items-center gap-1.5'>
														<span className='h-2 w-2 shrink-0 rounded-full' style={{backgroundColor: point.color}} />
														<span className='min-w-0 truncate text-body-muted'>{point.label}</span>
														<span className='ml-auto whitespace-nowrap text-body font-medium'>
															{hashrate ? `${hashrate.value} ${hashrate.unit}` : '—'}
														</span>
													</div>
												)
											})}
										</div>
										<time
											className='mt-1.5 block border-t border-line pt-1 text-[10px] text-body-subtle'
											dateTime={new Date(activeSample.timestamp).toISOString()}
										>
											{new Date(activeSample.timestamp).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
												second: '2-digit',
											})}
										</time>
									</div>
								</>
							)}
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
									<span className='text-body-subtle text-xs truncate' title={s.label}>
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
