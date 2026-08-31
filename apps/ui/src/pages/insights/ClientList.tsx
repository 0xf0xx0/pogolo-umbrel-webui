import {useQueries} from '@tanstack/react-query'

import InsightCard from './InsightsCard'
import {CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {api} from '@/lib/api'
import {usePoolInfo} from '@/hooks/usePogolo'
import {formatHashrate, formatDifficulty, formatUptimeSeconds} from '@/lib/formatPool'

import type {GopherInfo, MiniGopherInfo} from '#types'

function Field({label, value, title}: {label: string; value: string; title?: string}) {
	return (
		<div className='flex flex-col gap-0.5 min-w-0'>
			<span className='text-white/40 text-[11px] font-[400]'>{label}</span>
			<span className='text-white/80 text-[13px] font-[400] truncate' title={title ?? value}>
				{value}
			</span>
		</div>
	)
}

function ClientCard({mini, info}: {mini: MiniGopherInfo; info: GopherInfo | undefined}) {
	const hashrate = formatHashrate(info?.hashrate ?? 0)

	// pogolo reports SV1 as 1 and SV2 as 2
	const protocolVersion = info?.protocolVersion ?? mini.protocolVersion
	const protocol = protocolVersion === 2 ? 'SV2' : protocolVersion === 1 ? 'SV1' : '—'

	const shares = info ? `${info.sharesAccepted.toLocaleString()} / ${info.sharesRejected.toLocaleString()}` : '—'

	return (
		<div className='rounded-2xl bg-neutral-900/40 border-white/10 border-[0.5px] p-4 flex flex-col gap-3'>
			<div className='flex items-baseline justify-between gap-2 min-w-0'>
				<span className='text-white text-[14px] font-[500] truncate' title={info?.nickname || mini.extranonce1}>
					{info?.nickname || mini.extranonce1}
				</span>
				<span className='text-white/40 text-[11px] font-[400] shrink-0'>{protocol}</span>
			</div>

			<div className='flex items-baseline gap-1'>
				<span className='text-white text-[20px] font-[500] leading-none'>{hashrate.value}</span>
				<span className='text-white/50 text-[12px] font-[400]'>{hashrate.unit}</span>
			</div>

			<div className='grid grid-cols-2 gap-x-3 gap-y-2'>
				<Field label='User Agent' value={mini.userAgent || '—'} />
				<Field label='Shares (a/r)' value={shares} />
				<Field label='Best Share' value={info ? formatDifficulty(info.bestDifficulty) : '—'} />
				<Field label='Difficulty' value={info ? formatDifficulty(info.targetDifficulty) : '—'} />
				<Field
					label='Avg Share Time'
					value={info && info.averageShareTime > 0 ? `${info.averageShareTime.toFixed(1)}s` : '—'}
				/>
				<Field label='Uptime' value={info ? formatUptimeSeconds(info.uptime) : '—'} />
			</div>

			{info?.address && <Field label='Address' value={info.address} />}
		</div>
	)
}

export default function ClientList() {
	const {data, isLoading} = usePoolInfo()
	const gophers = data?.gophers ?? []

	// /api/v1/info only carries a user agent and id per miner, so fetch the full
	// stats for each connected miner alongside it.
	const details = useQueries({
		queries: gophers.map((gopher) => ({
			queryKey: ['pool', 'gopher', gopher.extranonce1],
			queryFn: () => api<GopherInfo>(`/pool/gopher/${encodeURIComponent(gopher.extranonce1)}`),
			refetchInterval: 5_000,
			// A miner that disconnects mid-flight 404s; keep the card rather than erroring the page
			retry: false,
		})),
	})

	return (
		<InsightCard>
			<CardHeader>
				<CardTitle className='font-bold text-white text-[20px] font-[400]'>
					Connected Miners
					{gophers.length > 0 && <span className='text-white/40 text-[15px] font-[300] ml-2'>{gophers.length}</span>}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className='text-white/40 text-[14px]'>Loading…</p>
				) : gophers.length === 0 ? (
					<div className='flex flex-col gap-1 py-4'>
						<span className='text-white/60 text-[14px]'>No miners connected</span>
						<span className='text-white/40 text-[12px]'>
							Point a miner at your pool and it will show up here.
						</span>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						{gophers.map((gopher, index) => (
							<ClientCard key={gopher.extranonce1} mini={gopher} info={details[index]?.data} />
						))}
					</div>
				)}
			</CardContent>
		</InsightCard>
	)
}
