import type {ConnectionDetails} from '#types'

// pogolo listens for miners on the stratum port. This is what we show in the
// connect modal / QR code so a miner can be pointed at the pool.
export async function getConnectionDetails(): Promise<ConnectionDetails> {
	const host = process.env['DEVICE_DOMAIN_NAME'] ?? 'umbrel.local'
	const port = process.env['STRATUM_PORT'] ?? '5661'

	return {
		stratum: {
			local: {
				host,
				port,
				uri: `stratum+tcp://${host}:${port}`,
			},
		},
	}
}
