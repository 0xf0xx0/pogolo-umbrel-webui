// Derived pool statistics.

import type {PogoloInfo} from '#types'

// The best share the pool has ever produced.
//
// pogolo's bestDifficulty covers shares that did not become blocks, so a found
// block can out-rank it. Take the highest of the two so the number never goes
// backwards after the pool finds a block.
export function bestShareDifficulty(info: PogoloInfo | undefined): number {
	if (!info) return 0

	const blockBest = info.blocksFound.reduce((best, block) => Math.max(best, block.difficulty), 0)

	return Math.max(info.bestDifficulty, blockBest)
}
