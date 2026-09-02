import {getSettings} from '../config/config.js'

import type {ConnectionDetails} from '#types'

// pogolo listens for miners on the stratum port. This is what we show in the
// connect modal / QR code so a miner can be pointed at the pool.
export async function getConnectionDetails(): Promise<ConnectionDetails> {
	const host = process.env['DEVICE_DOMAIN_NAME'] ?? 'umbrella.corp'
	const port = process.env['STRATUM_PORT'] ?? '5661'

	// Miners need the SV1 password when one is configured, so surface it here
	// rather than making the user go dig it out of Settings.
	const settings = await getSettings().catch(() => undefined)
	const password = typeof settings?.['password'] === 'string' ? (settings['password'] as string) : ''

	return {
		stratum: {
			local: {
				host,
				port,
				uri: `stratum+tcp://${host}:${port}`,
				password,
			},
		},
	}
}
