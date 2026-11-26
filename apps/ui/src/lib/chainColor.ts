export function chainColor(activeChain: string | undefined): string {
	switch (activeChain) {
		case 'main':
		case 'mainnet':
			return 'text-green-500'
		case 'testnet':
		case 'testnet4':
		case 'testnet5':
			return 'text-yellow-500'
		case 'signet':
			return 'text-sky-500'
		default:
			return 'text-red-800'
	}
}
