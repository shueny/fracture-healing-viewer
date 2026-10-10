import { MetricCharts } from './charts/MetricCharts'
import { ComparisonViews } from './scene/ComparisonViews'
import { ScenarioControls } from './ui/ScenarioControls'
import { Timeline } from './ui/Timeline'

export default function App() {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="min-h-0 flex-1">
        <ComparisonViews overlay={(slot) => <ScenarioControls slot={slot} />} />
      </div>
      <Timeline />
      <MetricCharts />
    </div>
  )
}
