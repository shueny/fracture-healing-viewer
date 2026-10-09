import { MetricCharts } from './charts/MetricCharts'
import { ComparisonViews } from './scene/ComparisonViews'
import { CasePanel } from './ui/CasePanel'
import { APP_SUBTITLE, APP_TITLE } from './ui/copy'
import { Disclaimer } from './ui/Disclaimer'
import { Footer } from './ui/Footer'
import { Legend } from './ui/Legend'
import { ScenarioControls } from './ui/ScenarioControls'
import { Timeline } from './ui/Timeline'

// PRD layout (desktop >= 1280 px, one screen, no scrolling):
// header / [case + legend | A view | B view] / timeline / charts / footer
export default function App() {
  return (
    <div className="flex h-full min-w-[1280px] flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-lg font-semibold">
          {APP_TITLE}
          <span className="ml-2 text-sm font-normal text-slate-500">{APP_SUBTITLE}</span>
        </h1>
        <Disclaimer />
      </header>
      <main className="flex min-h-0 flex-1">
        <aside className="w-52 shrink-0 space-y-6 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <CasePanel />
          <Legend />
        </aside>
        <div className="min-w-0 flex-1">
          <ComparisonViews overlay={(slot) => <ScenarioControls slot={slot} />} />
        </div>
      </main>
      <Timeline />
      <MetricCharts />
      <Footer />
    </div>
  )
}
