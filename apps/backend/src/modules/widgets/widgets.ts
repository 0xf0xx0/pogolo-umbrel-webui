// umbrelOS home-screen widget.
//
// umbrelOS expects strings for every field of a four-stats widget, and renders
// the widget without titles if the shape is wrong — so the error path returns
// the same shape with placeholder values rather than an error response.

import {getInfo} from '../pogolo/api-client.js'

const fmt = new Intl.NumberFormat('en', {maximumSignificantDigits: 3})
const intFmt = new Intl.NumberFormat('en')

// pogolo reports hashrate in MH/s
function formatHashrate(megaHashesPerSecond: number): {value: string; unit: string} {
	if (megaHashesPerSecond > 1e9) return {value: fmt.format(megaHashesPerSecond / 1e9), unit: 'Ph/s'}
	if (megaHashesPerSecond > 1e6) return {value: fmt.format(megaHashesPerSecond / 1e6), unit: 'Th/s'}
	if (megaHashesPerSecond > 1000) return {value: fmt.format(megaHashesPerSecond / 1000), unit: 'Gh/s'}
	return {value: fmt.format(megaHashesPerSecond), unit: 'Mh/s'}
}

function formatDifficulty(difficulty: number): {value: string; unit: string} {
	if (difficulty >= 1e15) return {value: fmt.format(difficulty / 1e15), unit: 'Peta'}
	if (difficulty >= 1e12) return {value: fmt.format(difficulty / 1e12), unit: 'Tera'}
	if (difficulty >= 1e9) return {value: fmt.format(difficulty / 1e9), unit: 'Giga'}
	if (difficulty >= 1e6) return {value: fmt.format(difficulty / 1e6), unit: 'Mega'}
	if (difficulty >= 1000) return {value: fmt.format(difficulty / 1000), unit: 'Kilo'}
	return {value: fmt.format(difficulty), unit: ''}
}

export async function stats() {
	try {
		const {totalHashrate, totalGophers, bestDifficulty, blockHeight} = await getInfo()

		const hashrate = formatHashrate(totalHashrate)
		const bestShare = formatDifficulty(bestDifficulty)

		return {
			type: 'four-stats',
			refresh: '5s',
			link: '',
			items: [
				{title: 'Hashrate', text: hashrate.value, subtext: hashrate.unit},
				{title: 'Gophers', text: intFmt.format(totalGophers)},
				{title: 'Height', text: intFmt.format(blockHeight)},
				{title: 'Best Share', text: bestShare.value, subtext: bestShare.unit},
			],
		}
	} catch (error) {
		console.error('Failed to build pool widget:', error)

		// Keep the shape so umbrelOS still renders the titles
		return {
			type: 'four-stats',
			refresh: '5s',
			link: '',
			items: [
				{title: 'Hashrate', text: '?'},
				{title: 'Gophers', text: '?'},
				{title: 'Height', text: '?'},
				{title: 'Best Share', text: '?'},
			],
		}
	}
}
