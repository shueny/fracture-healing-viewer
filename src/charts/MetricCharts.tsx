import { METRICS } from './chartRows'
import { MetricChart } from './MetricChart'

export function MetricCharts() {
  return (
    <section
      aria-label="指標圖表"
      className="grid h-56 shrink-0 grid-cols-3 gap-2 border-t border-slate-300 bg-white px-2 py-2"
    >
      {METRICS.map((info) => (
        <MetricChart key={info.metric} info={info} />
      ))}
    </section>
  )
}
