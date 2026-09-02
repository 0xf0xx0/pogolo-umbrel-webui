import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {TriangleAlert} from 'lucide-react'

export default function DangerZoneAlert() {
	return (
		<Alert className='bg-warn/10 text-warn border-none'>
			<TriangleAlert className='h-4 w-4' />
			<AlertTitle className='text-warn'>Danger Zone</AlertTitle>
			<AlertDescription className='text-warn'>
				Changes you make here are written straight to pogolo's config file. Please ensure that you know what you are
				doing, and that you understand how changes may impact your pool and the gophers connected to it.
			</AlertDescription>
		</Alert>
	)
}
