import {useQueries} from '@tanstack/react-query'

import InsightCard from './InsightsCard'
import {CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Field, SplitField, BigStat} from '@/components/shared/Field'
import {api} from '@/lib/api'
import {usePoolInfo, useGophers} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty, formatUptimeSeconds} from '@/lib/formatPool'

import type {GopherInfo, MiniGopherInfo} from '#types'

function ClientCard({mini, info}: {mini: MiniGopherInfo; info: GopherInfo | undefined}) {
	const hashrate = formatHashrate(info?.hashrate ?? 0)
	const bestDiff = formatDifficulty(info?.bestDifficulty ?? 0)
	const targetDiff = formatDifficulty(info?.targetDifficulty ?? 0)

	// pogolo reports SV1 as 1 and SV2 as 2
	const protocolVersion = info?.protocolVersion ?? mini.protocolVersion
	const protocol = protocolVersion === 2 ? 'SV2' : protocolVersion === 1 ? 'SV1' : '—'

	return (
		<div className='rounded-2xl bg-surface-raised border-line border-[0.5px] p-4 flex flex-col gap-3'>
			<div className='flex items-baseline justify-between gap-2 min-w-0'>
				<span className='text-body text-[14px] font-[500] truncate' title={info?.nickname || mini.extranonce1}>
					{info?.nickname || mini.extranonce1}
					{info?.nickname && (
						<span className='text-body-subtle text-[11px] font-[400]'> ({mini.extranonce1})</span>
					)}
				</span>
				<span className='text-body-faint text-[11px] font-[400] shrink-0'>{protocol}</span>
			</div>

			<BigStat
				value={hashrate.value || '—'}
				unit={hashrate.unit}
				tone='good'
				title={info ? `${info.hashrate} Mh/s` : undefined}
			/>

			<div className='grid grid-cols-2 gap-x-3 gap-y-2'>
				<Field label='User Agent' value={mini.userAgent || '—'} tone='muted' title={mini.userAgent} />

				{/* Accepted and rejected get their own tones, and the label spells out
				    which is which so the meaning does not rest on colour alone. */}
				<SplitField
					label='Shares (acc / rej)'
					segments={
						info
							? [
									{value: info.sharesAccepted.toLocaleString(), tone: 'good'},
									{value: info.sharesRejected.toLocaleString(), tone: info.sharesRejected > 0 ? 'bad' : 'muted'},
								]
							: [{value: '—', tone: 'muted'}]
					}
					title={info ? `${info.sharesAccepted} accepted, ${info.sharesRejected} rejected` : undefined}
				/>

				<Field
					label='Best Share'
					value={bestDiff.value || '—'}
					unit={bestDiff.unit}
					tone='highlight'
					title={info ? String(info.bestDifficulty) : undefined}
				/>
				<Field
					label='Target Diff'
					value={targetDiff.value || '—'}
					unit={targetDiff.unit}
					tone='accent'
					title={info ? String(info.targetDifficulty) : undefined}
				/>
				<Field
					label='Avg Share Time'
					// pogolo reports averageShareTime in milliseconds
					value={info ? formatUptimeSeconds(info.averageShareTime / 1000) : '—'}
					tone='muted'
				/>
				<Field label='Uptime' value={info ? formatUptimeSeconds(info.uptime) : '—'} tone='muted' />
			</div>

			{info?.address && (
				<Field label='Address' value={info.address} tone='muted' title={info.address} />
			)}
		</div>
	)
}

export default function ClientList() {
    const {data: gophersInfo, isLoading1} = useGophers()
	const {data, isLoading} = usePoolInfo()
	const gophers = data?.gophers ?? []
	// /api/v1/info only carries a user agent and id per miner, so fetch the full
	// stats for each connected miner alongside it.
    const details = gophersInfo ?? []


	return (
		<InsightCard>
			<CardHeader>
				<CardTitle className='text-body text-[20px] font-[400]'>
					Connected Gophers
					{gophers.length > 0 && (
						<span className='text-body-subtle text-[15px] font-[300] ml-2'>{gophers.length}</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className='text-body-subtle text-[14px]'>Loading…</p>
				) : gophers.length === 0 ? (
					<div className='flex flex-col gap-1 py-4'>
						<span className='text-body-muted text-[14px]'>No gophers connected</span>
						<span className='text-body-subtle text-[12px]'>Point your miner at pogolo and it will show up here.</span>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						{gophers.map((gopher, index) => (
							<ClientCard key={gopher.extranonce1} mini={gopher} info={details?.[index]} />
						))}
					</div>
				)}
			</CardContent>
		</InsightCard>
	)
}
