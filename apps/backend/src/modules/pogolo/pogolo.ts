// Pool status and info routes.
//
// pogolo runs as its own container, so we do not manage its lifecycle. "Running"
// means "its API answered us", and uptime comes from pogolo itself.

import {getInfo, getGopher, getGophers} from './api-client.js'

import type {PogoloStatus, PogoloInfo, GopherInfo} from '#types'

export async function status(): Promise<PogoloStatus> {
	try {
		const info = await getInfo()
		return {
			running: true,
			// pogolo reports uptime in seconds; convert to a start timestamp so the
			// UI can render a live-ticking duration.
			startedAt: Date.now() - info.uptime * 1000,
			error: null,
			pid: null,
		}
	} catch (error) {
		return {
			running: false,
			startedAt: null,
			error: error as Error,
			pid: null,
		}
	}
}

export async function info(): Promise<PogoloInfo> {
	return getInfo()
}

export async function gopher(idOrNickname: string): Promise<GopherInfo> {
	return getGopher(idOrNickname)
}
export async function gophers(): Promise<GopherInfo[]> {
	return getGophers()
}
