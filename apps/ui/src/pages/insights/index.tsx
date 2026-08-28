// TODO: make sure we handle pruned nodes properly here
import BlockRewardsChart from './BlockRewardsChart'
import PeersTable from './PeersTable'
import BlockSizeChart from './BlockSizeChart'
import FeeRateChart from './FeeRateChart'
import StatSummary from './StatSummary'

export default function InsightsPage() {
	return (
		<div className='flex flex-col gap-10 pb-26'>
            <StatSummary />
			{/* TODO(claude): replace with grid of currently connected clients and their stats, as reported by pogolos api */}
			<BlockRewardsChart />
			<BlockSizeChart />
			<FeeRateChart />
			<PeersTable />
		</div>
	)
}
