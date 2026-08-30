// HTTP client for pogolo's REST API.
//
// pogolo runs as a sibling container, so this is the only way we read pool state.
// /api/v1/info is polled by several consumers (widget, UI home, insights), so we
// cache it briefly to avoid hammering pogolo when multiple clients poll at once.

import type {PogoloInfo, GopherInfo} from '#types'

const POGOLO_API_URL = process.env['POGOLO_API_URL'] || 'http://127.0.0.1:5662'

// How long a fetched info snapshot stays fresh. The UI polls on a ~2s cadence,
// so this collapses concurrent pollers onto one upstream request without
// making the data feel stale.
const INFO_CACHE_MS = 1000

const REQUEST_TIMEOUT_MS = 5000

type CachedInfo = {
	fetchedAt: number
	value: PogoloInfo
}

let cachedInfo: CachedInfo | undefined

// Shared promise so concurrent callers during a fetch await the same request
// rather than each starting their own.
let inflightInfo: Promise<PogoloInfo> | undefined

async function fetchJson<T>(path: string): Promise<T> {
	const response = await fetch(`${POGOLO_API_URL}${path}`, {
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})

	if (!response.ok) {
		throw new Error(`pogolo API ${path} responded ${response.status}`)
	}

	return (await response.json()) as T
}

// Get a snapshot of pool stats, served from cache when recent.
export async function getInfo(): Promise<PogoloInfo> {
	if (cachedInfo && Date.now() - cachedInfo.fetchedAt < INFO_CACHE_MS) {
		return cachedInfo.value
	}

	// Fold concurrent callers into the in-flight request
	if (inflightInfo) return inflightInfo

	inflightInfo = fetchJson<PogoloInfo>('/api/v1/info')
		.then((value) => {
			cachedInfo = {fetchedAt: Date.now(), value}
			return value
		})
		.finally(() => {
			inflightInfo = undefined
		})

	return inflightInfo
}

// Get full stats for a single miner by extranonce1 or nickname.
export async function getGopher(idOrNickname: string): Promise<GopherInfo> {
	return fetchJson<GopherInfo>(`/api/v1/gopher/${encodeURIComponent(idOrNickname)}`)
}

// Whether pogolo is reachable. Used for the running indicator on the home page.
export async function isReachable(): Promise<boolean> {
	try {
		await getInfo()
		return true
	} catch {
		return false
	}
}
