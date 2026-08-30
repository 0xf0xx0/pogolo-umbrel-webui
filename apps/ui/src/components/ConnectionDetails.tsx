import {useState} from 'react'
import QrSvg from '@wojtekmaj/react-qr-svg'
import copy from 'copy-to-clipboard'
import {Copy, X as XIcon} from 'lucide-react'

import UmbrelLogo from '@/assets/umbrel-logo.svg?react'

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'

import WalletIcon from '@/assets/wallet.svg?react'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'

import {useConnectionDetails} from '@/hooks/useConnectionDetails'

export default function ConnectionDetails() {
	const {data} = useConnectionDetails()

	const conn = data?.stratum.local

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='cursor-pointer rounded-full bg-button-gradient backdrop-blur-xl'>
					<GradientBorderFromTop />
					<WalletIcon className='w-5 h-5 text-[#969696]' />
					<span className='text-[13px] text-white/80 font-[500]'>Connect</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				className='bg-card-gradient backdrop-blur-2xl border-white/10 border-[0.5px] rounded-2xl max-h-[90vh] flex flex-col sm:max-w-[520px]'
				showCloseButton={false}
			>
				<GradientBorderFromTop />
				<DialogClose asChild>
					<button className='absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'>
						<XIcon className='w-3 h-3 text-white/70' />
					</button>
				</DialogClose>
				<DialogHeader>
					<DialogTitle className='font-outfit text-white text-[20px] font-[400] text-left'>
						<div className='flex items-center gap-2'>
							<WalletIcon className='w-5 h-5 text-white' />
							Connect a miner
						</div>
					</DialogTitle>
					<DialogDescription className='text-white/60 text-left text-[13px]'>
						Point your miner at this address to start mining to your own pool. Most miners take the URL as-is; some
						want the host and port in separate fields.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 mt-2'>
					<div className='bg-gradient-to-b from-[#1C1C1C] to-[#0D0D0D] p-5 rounded-xl'>
						<QR value={conn?.uri} />
					</div>

					<div className='divide-y divide-white/6 overflow-hidden rounded-xl w-full h-fit bg-gradient-to-b from-[#1C1C1C] to-[#0D0D0D]'>
						<Field label='URL' value={conn?.uri} />
						<Field label='Host' value={conn?.host} />
						<Field label='Port' value={conn?.port?.toString()} />
					</div>

					<p className='text-white/50 text-[12px] font-[400]'>
						Set the worker/username to the on-chain address you want to be paid at. If you leave it blank, the pool
						address from Settings is used instead.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function Field({label, value}: {label: string; value?: string}) {
	const blank = !value // true when no data
	const [open, setOpen] = useState(false)

	const handleCopy = () => {
		// return early if we have nothing to copy
		if (blank) return

		copy(value!)
		setOpen(true)
		setTimeout(() => setOpen(false), 600)
	}

	return (
		<div className='h-[42px] grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 text-sm'>
			<span className='shrink-0 text-white'>{label}</span>

			<div className='flex min-w-0 items-center justify-end gap-2'>
				{/* show an em-dash when no data */}
				<span className='min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-normal text-white/60' title={value}>
					{value ?? '—'}
				</span>

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							onClick={handleCopy}
							disabled={blank} // disabled when no data
							className='h-4 w-4 shrink-0 p-0 hover:bg-transparent'
						>
							<Copy className='scale-75 text-white/70' />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						side='top'
						align='center'
						className='w-auto rounded-md border border-white/20 bg-black/90 px-2 py-1 text-[12px] text-white'
					>
						Copied!
					</PopoverContent>
				</Popover>
			</div>
		</div>
	)
}

// @wojtekmaj/react-qr-svg component
// We could use the more popularreact-qr-code instead, but we can't do borders on the individual qr cells with that library
// Note: If you are tweaking this, make sure that the code is readable afterwards. Cell borders and the logo overlay both reduce readability.
// Increasing the `level` (error correction) can help.
function QR({value}: {value?: string}) {
	if (!value) {
		return <div className='flex h-[196px] w-[196px] m-auto items-center rounded-md bg-white/5' />
	}

	return (
		<div className='relative flex justify-center'>
			<div className='p-2 rounded-md'>
				<QrSvg
					value={value}
					width={200}
					height={200}
					level='Q' // Q = 25% error correction
					fgColor='#9C4C00' // solid orange fill
					bgColor='transparent' // transparent background
					cellClassPrefix='qrPx' // produces .qrPx & .qrPx-filled that we can target with CSS
					style={{display: 'block', shapeRendering: 'crispEdges'}}
				/>
			</div>

			{/* Umbrel logo overlay */}
			<div className='absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 p-2 shadow-md pointer-events-none select-none bg-[#1C1C1C]'>
				<div className='w-full h-full flex items-center justify-center bg-white/10 rounded-md p-1.5'>
					<UmbrelLogo className='w-full h-full text-white' />
				</div>
			</div>

			{/* Correct selector: path.qrPx-filled */}
			<style>{`
        /* add a lighter-orange outline to each "filled" cell */
        .qrPx-filled {
          stroke: #FF7E05 !important;
          stroke-width: 0.5px !important;
          stroke-linejoin: miter;
          vector-effect: non-scaling-stroke;
        }
      `}</style>
		</div>
	)
}
