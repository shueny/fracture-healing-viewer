import type { ScenarioParams } from './data/healingModel'
import { ComparisonViews } from './scene/ComparisonViews'
import type { ScenarioSlot } from './scene/scenarioColors'
import { Timeline } from './ui/Timeline'

// Default comparison (owner): best case vs delayed healing. Per-view
// controls arrive in the next ticket.
const SCENARIOS: Record<ScenarioSlot, ScenarioParams> = {
  A: { nailDiameterMm: 11, loading: 'partial' },
  B: { nailDiameterMm: 10, loading: 'full' },
}

export default function App() {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="min-h-0 flex-1">
        <ComparisonViews scenarios={SCENARIOS} />
      </div>
      <Timeline />
    </div>
  )
}
