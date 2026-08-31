import {useState, useEffect} from 'react'
import {toast} from 'sonner'

import {Textarea} from '@/components/ui/textarea'
import {Button} from '@/components/ui/button'

import {useRawConfig, useUpdateRawConfig} from '@/hooks/useSettings'

// Direct editor for pogolo's pogolo.toml, for options this page does not model.
export default function CustomConfigEditor() {
	const {data, isLoading} = useRawConfig()
	const save = useUpdateRawConfig()

	const [text, setText] = useState('')

	useEffect(() => {
		if (data) setText(data.contents)
	}, [data])

	const isDirty = text !== (data?.contents ?? '')
	const canSave = !isLoading && !save.isPending && isDirty

	return (
		<div className='border border-white/20 rounded-lg p-4 w-full'>
			<label className='text-[14px] font-[400] text-white'>Edit pogolo.toml directly</label>
			<p className='text-[13px] font-[400] text-white/60'>
				This is pogolo's raw config file. Editing it here replaces the whole file, so anything you remove is gone.
				Invalid TOML is rejected.
			</p>

			<Textarea
				className='mt-2 h-40 w-full whitespace-pre-wrap !text-[13px] text-white border border-white/20 rounded-lg p-2 resize-none font-mono
					[&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:bg-transparent
					[&::-webkit-scrollbar-thumb]:bg-[hsla(0,0%,100%,0.15)] [&::-webkit-scrollbar-thumb]:rounded-full
					[&::-webkit-scrollbar-thumb]:hover:bg-[hsla(0,0%,100%,0.25)]
					[&::-webkit-scrollbar-track]:bg-transparent
					[scrollbar-width:thin] [scrollbar-color:hsla(0,0%,100%,0.15)_transparent]
					focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/30'
				placeholder='# key = value'
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>

			<Button
				type='button'
				className='mt-3'
				disabled={!canSave}
				onClick={() =>
					save.mutate(text, {
						onSuccess: () => toast.success('Config saved. Restart pogolo to apply.'),
						onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save config'),
					})
				}
			>
				Save config
			</Button>
		</div>
	)
}
