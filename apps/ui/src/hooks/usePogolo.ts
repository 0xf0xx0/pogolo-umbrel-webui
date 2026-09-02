import {useQuery} from '@tanstack/react-query'
import {api} from '@/lib/api'
import type {PogoloInfo, PogoloStatus, GopherInfo} from '#types'

// Snapshot of pool stats. This is the single source for hashrate, connected
// miners, found blocks and pool height, so most of the UI reads from here.
export function usePoolInfo() {
	return useQuery({
		queryKey: ['pool', 'info'],
		queryFn: () => api<PogoloInfo>('/pool/info'),
		refetchInterval: 2_000,
		staleTime: 1_000,
	})
}

export function usePoolStatus() {
	return useQuery({
		queryKey: ['pool', 'status'],
		queryFn: () => api<PogoloStatus>('/pool/status'),
		refetchInterval: 5_000,
		staleTime: 2_500,
	})
}

// Full stats for one miner, by extranonce1 or nickname.
export function useGopher(idOrNickname: string | null) {
	return useQuery({
		queryKey: ['pool', 'gopher', idOrNickname],
		queryFn: () => api<GopherInfo>(`/pool/gophers/${encodeURIComponent(idOrNickname as string)}`),
		enabled: idOrNickname !== null,
		refetchInterval: 5_000,
	})
}

// Full stats for all miners
export function useGophers() {
	return useQuery({
		queryKey: ['pool', 'gopher'],
		queryFn: () => api<GopherInfo[]>(`/pool/gophers`),
        refetchInterval: 5_000,
        staleTime: 2_500,
	})
}
