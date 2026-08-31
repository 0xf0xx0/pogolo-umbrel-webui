// Formatting helpers for pool stats.
// pogolo reports hashrate in MH/s and difficulty as a plain number.

const compact = new Intl.NumberFormat('en', {maximumFractionDigits: 2})

export function formatHashrate(megaHashesPerSecond: number): {value: string; unit: string} {
	if (!Number.isFinite(megaHashesPerSecond) || megaHashesPerSecond <= 0) return {value: '0', unit: 'MH/s'}
	if (megaHashesPerSecond >= 1e12) return {value: compact.format(megaHashesPerSecond / 1e12), unit: 'EH/s'}
	if (megaHashesPerSecond >= 1e9) return {value: compact.format(megaHashesPerSecond / 1e9), unit: 'PH/s'}
	if (megaHashesPerSecond >= 1e6) return {value: compact.format(megaHashesPerSecond / 1e6), unit: 'TH/s'}
	if (megaHashesPerSecond >= 1e3) return {value: compact.format(megaHashesPerSecond / 1e3), unit: 'GH/s'}
	return {value: compact.format(megaHashesPerSecond), unit: 'MH/s'}
}

// Difficulty is unitless, so large values get an SI-style suffix.
export function formatDifficulty(difficulty: number): string {
	if (!Number.isFinite(difficulty) || difficulty <= 0) return '0'
	if (difficulty >= 1e15) return `${compact.format(difficulty / 1e15)}P`
	if (difficulty >= 1e12) return `${compact.format(difficulty / 1e12)}T`
	if (difficulty >= 1e9) return `${compact.format(difficulty / 1e9)}G`
	if (difficulty >= 1e6) return `${compact.format(difficulty / 1e6)}M`
	if (difficulty >= 1e3) return `${compact.format(difficulty / 1e3)}K`
	return compact.format(difficulty)
}

// pogolo reports uptime in seconds
export function formatUptimeSeconds(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0m'

	const days = Math.floor(seconds / 86_400)
	const hours = Math.floor((seconds % 86_400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)

	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hr`
	if (hours > 0) return `${hours} hr ${minutes} min`
	return `${minutes} min`
}
