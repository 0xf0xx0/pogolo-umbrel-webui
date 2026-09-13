import {useState} from 'react'
import QrSvg from '@wojtekmaj/react-qr-svg'
import {TriangleAlert, X as XIcon, Info} from 'lucide-react'
import {motion, AnimatePresence} from 'framer-motion'

import Logo from '@/assets/logo.svg?react'
import WalletIcon from '@/assets/wallet.svg?react'

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import {CopyRow} from '@/components/shared/Field'

import {useConnectionDetails} from '@/hooks/useConnectionDetails'

export default function ConnectionDetails() {
	const {data} = useConnectionDetails()

	const [tab, setTab] = useState<'sv1' | 'sv2'>('sv1')
    const conn = data?.stratum.local
    const uri = `${tab === 'sv2' ? "stratum2+tcp://" : "stratum+tcp://"}${conn?.uri}`

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='not-last-of-type:cursor-pointer rounded-full bg-button-gradient backdrop-blur-xl'>
					<GradientBorderFromTop />
					<WalletIcon className='w-5 h-5 text-body-subtle' />
					<span className='text-sm text-body font-medium'>Connect</span>
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
					<DialogTitle className='font-bold text-body text-lg text-left'>
						<div className='flex items-center gap-2'>
							<WalletIcon className='w-5 h-5 text-body' />
							Connect a gopher
						</div>
					</DialogTitle>
					<DialogDescription className='text-body-muted text-left text-sm'>
						Point your miner at this address to start mining to your pool. Most miners take the URL as-is; some
						want the host and port in separate fields.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 mt-2 grid grid-cols-3 gap-4'>
					<div className='bg-gradient-to-b from-surface-input to-surface p-5 rounded-xl'>
    					<Tabs value={tab} onValueChange={(v: string) => setTab(v as 'sv1' | 'sv2')} className='w-[200px] mx-auto mb-3'>
    						<TabsList className='relative flex w-full rounded-md bg-surface backdrop-blur-xl p-1 ring-white/10'>
    							<GradientBorderFromTop />

    							<TabsTrigger
    								value='sv1'
    								className='relative cursor-pointer rounded-md py-2 px-4 font-bold text-body/60 data-[state=active]:text-body transition-colors data-[state=active]:bg-transparent'
    							>
    								{tab === 'sv1' && (
    									<motion.span
    										layoutId='connection-pill'
    										className='absolute inset-0 -z-10 rounded-sm bg-surface-raised'
    										transition={{type: 'tween', ease: 'backOut', duration: 0.4}}
    									>
    										<GradientBorderFromTop />
    									</motion.span>
    								)}
    								SV1
    							</TabsTrigger>

    							<TabsTrigger
    								value='sv2'
    								className='relative cursor-pointer rounded-md py-2 px-4 font-bold text-body/60 data-[state=active]:text-body transition-colors data-[state=active]:bg-transparent'
    							>
    								{tab === 'sv2' && (
    									<motion.span
    										layoutId='connection-pill'
    										className='absolute inset-0 -z-10 rounded-sm bg-surface-raised'
    										transition={{type: 'tween', ease: 'backOut', duration: 0.4}}
    									>
    										<GradientBorderFromTop />
    									</motion.span>
    								)}
    								SV2
    							</TabsTrigger>
    						</TabsList>
    					</Tabs>
                        <QR value={uri} />
                    </div>

                    <div className='col-span-2 grid grid-rows-4'>
                        <p className='text-body-subtle text-sm'>
    						Set the username to your on-chain address. If you leave it blank or just provide a workername, the pool
    						address from Settings will be used instead.
    					</p>

    					<div className='row-span-2 divide-y divide-line overflow-hidden grid grid-cols-6 w-full h-fit rounded-xl bg-gradient-to-b from-surface-input to-surface'>
    						<CopyRow className='col-span-4' label='Host' value={conn?.host} />
    						<CopyRow className='col-span-2' label='Port' value={conn?.port?.toString()} />
    						<CopyRow className='col-span-4' label='Username' value='btcaddress.workername' />
                            <CopyRow className='col-span-2' label={tab === 'sv1' ? 'Pass' : 'Authority'} value={tab === 'sv1' ? conn?.password : ''} />
                            <CopyRow className='col-span-full' label='URL' value={uri} />
                        </div>
                        {tab === 'sv2' &&
                            <p className='text-body-subtle text-sm'>
                                <Alert className='bg-blue-900/30 text-accent border-none col-span-full'>
              						<Info className='h-4 w-4' />
              						<AlertDescription className='text-body'>
                                        SV2 certificate validation is optional for local networks.
              						</AlertDescription>
               					</Alert>
                            </p>
                        }
                    </div>
                    <Alert className='bg-amber-900/30 text-warn border-none col-span-full'>
						<TriangleAlert className='h-4 w-4' />
						<AlertDescription className='text-warn'>
    						Please don't expose pogolo on the public internet; instead, use Tailscale or ZeroTier for remote access.
						</AlertDescription>
					</Alert>
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
					fgColor='#c1e269' // pogolo green fill
					bgColor='transparent' // transparent background
					cellClassPrefix='qrPx' // produces .qrPx & .qrPx-filled that we can target with CSS
					style={{display: 'block', shapeRendering: 'crispEdges'}}
				/>
			</div>

			{/* Pogolo logo overlay */}
			<div className='absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 p-2 shadow-md pointer-events-none select-none bg-surface-input'>
				<div className='w-full h-full flex items-center justify-center bg-white/10 rounded-md p-1.5'>
					<Logo className='w-full h-full text-body' />
				</div>
			</div>

			{/* Correct selector: path.qrPx-filled */}
			<style>{`
        .qrPx-filled {
          stroke-width: 0.5px !important;
          stroke-linejoin: miter;
          vector-effect: non-scaling-stroke;
        }
      `}</style>
		</div>
	)
}
