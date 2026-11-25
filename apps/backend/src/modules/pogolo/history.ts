// In-memory time series of pool metrics.
//
// pogolo's API only reports instantaneous values, so we sample it on an interval
// and keep a bounded history the UI can chart. This is deliberately generic: a
// sample is a set of named series, so adding another metric later means adding a
// key here rather than new plumbing.
//
// History is in memory only, so it resets when the backend restarts.

import {getInfo, getGophers} from './api-client.js'

import type {MetricSample, MetricHistory} from '#types'

// How often we sample. 10s over the default window gives ~1 hour of history.
const SAMPLE_INTERVAL_MS = 10_000

// Samples retained. At 10s each, 360 samples is an hour.
const MAX_SAMPLES = 360

const samples: MetricSample[] = []

let started = false

// The pool's own total is stored under this reserved series id, so it cannot
// collide with a gopher's extranonce1.
export const POOL_SERIES = 'pool'

// Namespaces keep client series separate from the pool total and from each
// other's fallback ids. A nickname remains stable across reconnections.
const NICKNAME_SERIES_PREFIX = 'nickname:'
const ID_SERIES_PREFIX = 'id:'

async function sample() {
	try {
		const info = await getInfo()

		// Hashrate per series: the pool total plus each connected gopher. Key named
		// gophers by nickname so their history survives disconnects and reconnects.
		const hashrate: Record<string, number> = {[POOL_SERIES]: info.totalHashrate}

		// /api/v1/info carries no per-gopher hashrate, so fetch each one's detail.
		// A gopher that disconnects mid-sample is simply left out of this sample.
		const details = await getGophers()

		for (const result of details) {
			const id = result.nickname
				? `${NICKNAME_SERIES_PREFIX}${result.nickname}`
				: `${ID_SERIES_PREFIX}${result.extranonce1}`
			// Multiple simultaneous connections can share a nickname.
			hashrate[id] = (hashrate[id] ?? 0) + result.hashrate
		}

		samples.push({timestamp: Date.now(), hashrate})
		if (samples.length > MAX_SAMPLES) samples.shift()
	} catch {
		// pogolo may be down; skip this sample rather than recording a zero, which
		// would look like a real drop to zero on the chart.
	}
}

// Begin sampling. Safe to call more than once.
export function startSampling() {
	if (started) return
	started = true

	void sample()

	const timer = setInterval(() => void sample(), SAMPLE_INTERVAL_MS)
	// Never keep the process alive just to sample
	timer.unref()
}

// The recorded history, newest last.
export function getHistory(): MetricHistory {
	return {
		intervalMs: SAMPLE_INTERVAL_MS,
		samples: samples.slice(),
	}
}
