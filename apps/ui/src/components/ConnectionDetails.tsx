import QrSvg from '@wojtekmaj/react-qr-svg'
import {X as XIcon} from 'lucide-react'

import Logo from '@/assets/logo.svg?react'

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

import WalletIcon from '@/assets/wallet.svg?react'
import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import {CopyRow} from '@/components/shared/Field'

import {useConnectionDetails} from '@/hooks/useConnectionDetails'

export default function ConnectionDetails() {
	const {data} = useConnectionDetails()

	const conn = data?.stratum.local

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='cursor-pointer rounded-full bg-button-gradient backdrop-blur-xl'>
					<GradientBorderFromTop />
					<WalletIcon className='w-5 h-5 text-body-subtle' />
					<span className='text-[13px] text-body font-[500]'>Connect</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				className='bg-card-gradient backdrop-blur-2xl border-line border-[0.5px] rounded-2xl max-h-[90vh] flex flex-col sm:max-w-[60vw]'
				showCloseButton={false}
			>
				<GradientBorderFromTop />
				<DialogClose asChild>
					<button className='absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors'>
						<XIcon className='w-3 h-3 text-body-muted' />
					</button>
				</DialogClose>
				<DialogHeader>
					<DialogTitle className='font-bold text-body text-[20px] font-[400] text-left'>
						<div className='flex items-center gap-2'>
							<WalletIcon className='w-5 h-5 text-body' />
							Connect a gopher
						</div>
					</DialogTitle>
					<DialogDescription className='text-body-muted text-left text-[13px]'>
						Point your miner at this address to start mining to your pogolo. Most miners take the URL as-is; some
						want the host and port in separate fields.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 mt-2 grid grid-cols-3 gap-4'>
					<div className='bg-gradient-to-b from-surface-input to-surface p-5 rounded-xl'>
						<QR value={conn?.uri} />
                    </div>

                    <div className='col-span-2 grid grid-rows-4'>
                        <p className='text-body-subtle text-[12px] font-[400]'>
    						Set the username to your on-chain address. If you leave it blank or just provide a workername, the pool
    						address from Settings will be used instead.
    					</p>

    					<div className='row-span-3 divide-y divide-line overflow-hidden grid grid-cols-6 w-full h-fit rounded-xl bg-gradient-to-b from-surface-input to-surface'>
    						<CopyRow className='col-span-full' label='URL' value={conn?.uri} />
    						<CopyRow className='col-span-4' label='Host' value={conn?.host} />
    						<CopyRow className='col-span-2' label='Port' value={conn?.port?.toString()} />
    						<CopyRow className='col-span-4' label='Username' value='btcaddress.workername' />
    						<CopyRow className='col-span-2' label='Pass' value={conn?.password || ''} />
    					</div>
                    </div>
				</div>
			</DialogContent>
		</Dialog>
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
					fgColor='#c1e269' // solid orange fill
					bgColor='transparent' // transparent background
					cellClassPrefix='qrPx' // produces .qrPx & .qrPx-filled that we can target with CSS
					style={{display: 'block', shapeRendering: 'crispEdges'}}
				/>
			</div>

			{/* Umbrel logo overlay */}
			<div className='absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 p-2 shadow-md pointer-events-none select-none bg-surface-input'>
				<div className='w-full h-full flex items-center justify-center bg-white/10 rounded-md p-1.5'>
					<Logo className='w-full h-full text-body' />
				</div>
			</div>

			{/* Correct selector: path.qrPx-filled */}
			<style>{`
        /* add a lighter-orange outline to each "filled" cell */
        .qrPx-filled {
          stroke-width: 0.5px !important;
          stroke-linejoin: miter;
          vector-effect: non-scaling-stroke;
        }
      `}</style>
		</div>
	)
}
