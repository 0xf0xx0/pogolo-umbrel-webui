import {TriangleAlert, X as XIcon, Info, Pickaxe} from 'lucide-react'
import {motion, AnimatePresence} from 'framer-motion'

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

import {GradientBorderFromTop} from '@/components/shared/GradientBorders'
import {usePoolInfo} from '@/hooks/usePogolo'
import {useConnectionDetails} from '@/hooks/useConnectionDetails'

export default function About() {
	const {data: connDetails} = useConnectionDetails()
	const {data: info, isLoading, isError} = usePoolInfo()


	const apiLicense = `${window.location.protocol}//${connDetails?.stratum.host}:5662/license.txt`
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='not-last-of-type:cursor-pointer rounded-full bg-button-gradient backdrop-blur-xl'>
					<GradientBorderFromTop />
					<Info className='w-5 h-5' />
					<span className='text-sm text-body font-medium hidden md:flex'>About</span>
				</Button>
			</DialogTrigger>
			<DialogContent
				className='bg-card-gradient overflow-scroll backdrop-blur-2xl border-line border-[0.5px] rounded-2xl max-h-[90vh] flex flex-col sm:max-w-[100vw] sm:max-h-screen md:max-w-3xl xl:max-w-5xl 2xl:max-w-7xl 2xl:top-1/6'
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
							<Logo className='w-15 h-15 text-body' />

							<h2>
								pogolo{' '}
								{!isLoading && (
									<span>
										v{info?.version} on{' '}
										<span
											className={
												info?.activeChain === 'mainnet'
													? 'text-[#F7931A]'
													: info?.activeChain.startsWith('test')
														? 'text-sky-500'
														: 'text-red-800'
											}
										>
											{info?.activeChain}
										</span>
									</span>
								)}
								<br />
								<span className='text-sm'>
									<a className='text-blue-400 hover:underline' href='https://git.0xf0xx0.eth.limo/0xf0xx0/pogolo'>
										repository
									</a>{' '}
									|{' '}
									<a className='text-blue-400 hover:underline' href='https://github.com/0xf0xx0/pogolo/issues'>
										issue tracker
                                    </a>{' '}
                                    |{' '}
                                    <a className='text-blue-400 hover:underline' href='https://osmu.xyz/t/pogolo-local-golang-pool/28'>
										forum thread
                                    </a>
								</span>
							</h2>
						</div>
					</DialogTitle>
                    <DialogDescription className='text-body-muted text-left text-sm'>
                        <p>thanks for runnin pogolo :3</p>
                        <p>if you wind a block,</p>
					</DialogDescription>
				</DialogHeader>
				<div className='md:gap-4 text-body-muted text-sm'>
					<div>
						<i>
							<p>
								This program is free software: you can redistribute it and/or modify it under the terms of the GNU
								Affero General Public License as published by the Free Software Foundation, either version 3 of the
								License, or (at your option) any later version.
							</p>
							<br />
							<p>
								This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
								the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General
								Public License for more details.
							</p>
							<br />
							<p>
								A copy of the GNU Affero General Public License is embedded within this program. It can be acquired via{' '}
								<code>pogolo --license</code> and the API endpoint{' '}
								<a className='text-blue-400 hover:underline' href={apiLicense}>
									/license.txt
								</a>
								. Otherwise, see{' '}
								<a className='text-blue-400 hover:underline' href='https://www.gnu.org/licenses/'>
									https://www.gnu.org/licenses/
								</a>
								.
							</p>
						</i>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
