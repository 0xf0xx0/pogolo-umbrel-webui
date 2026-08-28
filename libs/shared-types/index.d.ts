// Shared type declarations from the backend and ui
/// TODO(claude): strip down for pogolo

export type BitcoindVersion = {
	implementation: string /// TODO(claude): unneeded, just version
	version: string
}

export type BitcoindStatus = {
	running: boolean
	startedAt: number | null
	error: Error | null
	// TODO: we probably don't want to pid to the UI, but nice to have in dev right now
	pid: number | null
}

type BitcoindLifecycleResult = 'started' | 'stopped' | 'no_op'

export type BitcoindLifecycleResponse = {
	running: boolean
	pid: number | null
	result: BitcoindLifecycleResult
}

export type ExitInfo = {
	code: number | null
	sig: NodeJS.Signals | null
	logTail: string[]
	message: string
}

/// TODO(claude): peer info unneeded
export type PeerCount = {
	total: number
	byNetwork: Record<string, {inbound: number; outbound: number; total: number}>
}

// Partial type of getpeerinfo
export type PeerInfo = {
	id: number
	addr: string
	addrlocal?: string
	network: string
	relaytxes: boolean
	lastsend: number
	lastrecv: number
	bytessent: number
	bytesrecv: number
	conntime: number
	pingtime: number
	pingwait: number
	version: number
	subver: string
	inbound: boolean
}

export type PeerLocation = {
	addr: string
	network: string
	location: [number, number]
}

export type PeerLocationsResponse = {
	userLocation: [number, number]
	peers: PeerLocation[]
}
/// TODO(claude): tx/block/sync unneeded
export type RawTransaction = {
	txid: string
	fee?: number // fee in BTC (not available for coinbase)
	vsize: number
	weight: number
}

// subset of getblock (verbosity 2) that we care about
export type RawBlock = {
	hash: string
	height: number
	time: number
	nTx: number
	size: number
	weight: number
	tx: RawTransaction[]
}

// Unified block type used throughout the app (backend cache, API, frontend)
export type Block = {
	hash: string
	height: number
	time: number
	size: number
	weight: number
	txCount: number
	subsidySat: number
	feesSat: number
	feeRates: {p10: number; p50: number; p90: number}
	transactionGrid: {size: number; numberOfBlocks: number}[]
}

// TODO: Replace these 2 below with actual types
export type SummaryResponse = {
	networkInfo: unknown
	blockchainInfo: unknown
	peerInfo: unknown
}

export type StatusResponse = {
	running: boolean
	pid: number
}

export type SyncStatus = {
	syncProgress: number
	isInitialBlockDownload: boolean
	blockHeight: number
	validatedHeaderHeight: number
}

export type Stats = {
	peers: number // total connections
	mempoolBytes: number // Total memory usage for the mempool in bytes
	chainBytes: number // the estimated size of the block and undo files on disk in bytes
	uptimeSec: number // seconds since bitcoind started (0 if down)
}

/// TODO(claude): reduce to just local
export type ConnectionDetails = {
	p2p: {
		tor: {
			host: string
			port: string
			uri: string
		}
		local: {
			host: string
			port: string
			uri: string
		}
	}
	rpc: {
		tor: {
			host: string
			port: string
			username: string
			password: string
			uri: string
		}
		local: {
			host: string
			port: string
			username: string
			password: string
			uri: string
		}
	}
}
