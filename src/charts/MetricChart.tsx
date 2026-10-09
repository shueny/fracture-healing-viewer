import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getScenario } from '../data/scenarios'
import { SCENARIO_COLORS } from '../scene/scenarioColors'
import { useViewerStore } from '../store/useViewerStore'
import { buildChartRows, type MetricInfo } from './chartRows'

const AXIS = { stroke: '#94a3b8', fontSize: 11 } // recessive axes (slate-400)

// One metric over weeks 0-20, a line per scenario (PRD F5).
export function MetricChart({ info }: { info: MetricInfo }) {
  const scenarios = useViewerStore((s) => s.scenarios)
  const rows = buildChartRows(getScenario(scenarios.A), getScenario(scenarios.B), info.metric)
  const format = (v: number) => `${v.toFixed(info.digits)} ${info.unit}`

  return (
    <figure className="flex h-full min-w-0 flex-col">
      <figcaption className="px-2 text-sm font-semibold text-slate-700">
        {info.title}
        <span className="ml-1 font-normal text-slate-500">({info.unit})</span>
      </figcaption>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="week"
              type="number"
              domain={[0, 20]}
              ticks={[0, 4, 8, 12, 16, 20]}
              tick={AXIS}
              stroke={AXIS.stroke}
            />
            <YAxis width={40} tick={AXIS} stroke={AXIS.stroke} />
            <Tooltip
              formatter={(value, name) => [format(Number(value)), `方案 ${name}`]}
              labelFormatter={(week) => `第 ${week} 週`}
              cursor={{ stroke: '#64748b', strokeWidth: 1 }}
              itemStyle={{ color: '#334155' }} // text in text colour; the name carries identity
            />
            <Legend
              iconType="plainline"
              formatter={(name) => <span className="text-xs text-slate-600">方案 {name}</span>}
              wrapperStyle={{ fontSize: 12 }}
            />
            {(['A', 'B'] as const).map((slot) => (
              <Line
                key={slot}
                dataKey={slot}
                stroke={SCENARIO_COLORS[slot]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false} // timeline drives motion, not the chart
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
