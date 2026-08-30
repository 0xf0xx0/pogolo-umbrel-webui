// Shared type declarations from the backend and ui

export type PogoloVersion = {
	version: string
}

export type PogoloStatus = {
	running: boolean
	startedAt: number | null
	error: Error | null
	pid: number | null
}

export type ExitInfo = {
	code: number | null
	sig: NodeJS.Signals | null
	logTail: string[]
	message: string
}

// A miner currently connected to the pool, as listed by /api/v1/info
export type MiniGopherInfo = {
	userAgent: string
	extranonce1: string
	// Present in live responses but not required by the spec
	protocolVersion?: number
}

// Full per-miner stats from /api/v1/gopher/{idOrNickname}
export type GopherInfo = {
	address: string
	averageShareTime: number // seconds
	bestDifficulty: number
	extranonce1: string
	hashrate: number // MH/s
	nickname: string
	protocolVersion: number // 1 = SV1, 2 = SV2
	sharesAccepted: number
	sharesRejected: number
	targetDifficulty: number
	uptime: number // seconds
	userAgent: string
}

// A block the pool has found, from /api/v1/info
export type FoundBlockInfo = {
	difficulty: number
	extranonce2: string
	gopher: string // nickname or id
	hash: string // byte-reversed block hash
	height: number
	nonce: number
	timestamp: number // seconds since unix epoch
	version: number
}

// Snapshot of pool stats from /api/v1/info
export type PogoloInfo = {
	uptime: number // seconds
	blocksFound: FoundBlockInfo[]
	blockHeight: number
	totalGophers: number
	totalHashrate: number // MH/s
	bestDifficulty: number
	tag: string
	gophers: MiniGopherInfo[]
}

// One line of pogolo output, streamed over the log websocket.
// `html` is the line with its ANSI escapes converted to spans.
export type LogLine = {
	seq: number
	timestamp: number
	html: string
}

export type ConnectionDetails = {
	stratum: {
		local: {
			host: string
			port: string
			uri: string
		}
	}
}
