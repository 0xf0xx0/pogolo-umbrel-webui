import {useSettings} from './useSettings'

// Builds links into the configured block explorer.
//
// mempool.space and btc-rpc-explorer both serve block pages at /block/<hash>,
// so one URL shape covers either. Returns null when no explorer is configured,
// which callers use to render plain text instead of a link.
export function useExplorer() {
	const {data: settings} = useSettings()

	const configured = typeof settings?.['explorer_url'] === 'string' ? (settings['explorer_url'] as string).trim() : ''

	// Drop a trailing slash so we don't build "//block/..."
	const base = configured.replace(/\/+$/, '')

	return {
		hasExplorer: base.length > 0,
		blockUrl: (hash: string) => (base ? `${base}/block/${hash}` : null),
	}
}
