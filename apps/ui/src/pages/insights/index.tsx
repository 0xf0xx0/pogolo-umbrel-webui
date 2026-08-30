import ClientList from './ClientList'
import StatSummary from './StatSummary'

export default function InsightsPage() {
	return (
		<div className='flex flex-col gap-10 pb-26'>
			<StatSummary />
			<ClientList />
		</div>
	)
}
