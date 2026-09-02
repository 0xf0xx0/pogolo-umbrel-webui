import ClientList from './ClientList'
import HashrateChart from './HashrateChart'
import StatSummary from './StatSummary'

export default function InsightsPage() {
	return (
		<div className='flex flex-col gap-10 pb-26'>
			<StatSummary />
			<HashrateChart />
			<ClientList />
		</div>
	)
}
