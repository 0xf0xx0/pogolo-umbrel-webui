// Formatting helpers for pool stats.
// pogolo reports hashrate in Mh/s and difficulty as a plain number.

const compact = new Intl.NumberFormat('en', {maximumFractionDigits: 2})

export function formatHashrate(megaHashesPerSecond: number): {value: string; unit: string} {
	if (!Number.isFinite(megaHashesPerSecond) || megaHashesPerSecond <= 0) return {value: '0', unit: 'Mh/s'}
	if (megaHashesPerSecond >= 1e12) return {value: compact.format(megaHashesPerSecond / 1e12), unit: 'Eh/s'}
	if (megaHashesPerSecond >= 1e9) return {value: compact.format(megaHashesPerSecond / 1e9), unit: 'Ph/s'}
	if (megaHashesPerSecond >= 1e6) return {value: compact.format(megaHashesPerSecond / 1e6), unit: 'Th/s'}
	if (megaHashesPerSecond >= 1e3) return {value: compact.format(megaHashesPerSecond / 1e3), unit: 'Gh/s'}
	return {value: compact.format(megaHashesPerSecond), unit: 'Mh/s'}
}

// Difficulty is unitless, so large values get an SI-style suffix.
export function formatDifficulty(difficulty: number): {value: string; unit: string} {
	if (!Number.isFinite(difficulty) || difficulty <= 0) return {value: '', unit: ''}
	if (difficulty >= 1e15) return {value: compact.format(difficulty / 1e15), unit: 'P'}
	if (difficulty >= 1e12) return {value: compact.format(difficulty / 1e12), unit: 'T'}
	if (difficulty >= 1e9) return {value: compact.format(difficulty / 1e9), unit: 'G'}
	if (difficulty >= 1e6) return {value: compact.format(difficulty / 1e6), unit: 'M'}
	if (difficulty >= 1e3) return {value: compact.format(difficulty / 1e3), unit: 'K'}
	return {value: compact.format(difficulty), unit: ''}
}

// pogolo reports uptime in seconds
export function formatUptimeSeconds(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0 sec'

	const days = Math.floor(seconds / 86_400)
	const hours = Math.floor((seconds % 86_400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
	seconds = Math.floor((seconds % 60)*10)/10

	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hr`
	if (hours > 0) return `${hours} hr ${minutes} min`
	if (minutes > 0) return `${minutes} min ${Math.floor(seconds)} sec`
	return `${seconds >= 10 ? Math.floor(seconds) : seconds} sec`
}
