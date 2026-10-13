// Fills a setting with a fresh SV2 keypair from the keygen wasm (see main.tsx).
// Renders nothing if the wasm hasn't loaded, so a failed init just hides the button.

import {useEffect, useState} from 'react'

import {Button} from '@/components/ui/button'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'

const hasKeygen = () => typeof globalThis.Keygen === 'function'

export default function KeygenButton({
	currentValue,
	onGenerate,
	disabled,
}: {
	currentValue: string
	onGenerate: (keypair: string) => void
	disabled?: boolean
}) {
	const [ready, setReady] = useState(hasKeygen)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)

	// The wasm loads async, so it may finish after this renders
	useEffect(() => {
		if (ready) return
		const onReady = () => setReady(hasKeygen())
		window.addEventListener('keygen-ready', onReady)
		return () => window.removeEventListener('keygen-ready', onReady)
	}, [ready])

	if (!ready) return null

	const generate = () => onGenerate(globalThis.Keygen!())

	return (
		<>
			<Button
				type='button'
				disabled={disabled}
				// Only ask before replacing an existing key
				onClick={() => (currentValue ? setIsConfirmOpen(true) : generate())}
			>
				Generate
			</Button>

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent className='bg-card-gradient backdrop-blur-2xl border-line border-[0.5px] rounded-2xl'>
					<AlertDialogHeader>
						<AlertDialogTitle className='font-normal text-body text-xl text-left'>
							Replace authority keypair?
						</AlertDialogTitle>
						<AlertDialogDescription className='text-body-muted text-left text-sm'>
							This changes the authority public key, so miners will need the new SV2 connection URL. Nothing is
							saved until you click Save changes.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel className='hover:bg-surface-raised'>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={generate}>Replace</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
