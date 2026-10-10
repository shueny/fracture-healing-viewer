import { LOADINGS, NAIL_DIAMETERS_MM, type Loading } from '../data/healingModel'
import { SCENARIO_COLORS, type ScenarioSlot } from '../scene/scenarioColors'
import { useViewerStore } from '../store/useViewerStore'

const LOADING_LABELS: Record<Loading, string> = { partial: '部分負重', full: '完全負重' }

interface SegmentedProps<T extends string | number> {
  label: string
  options: readonly T[]
  value: T
  format: (v: T) => string
  color: string
  onChange: (v: T) => void
}

// A small group of toggle buttons; exactly one is pressed.
function Segmented<T extends string | number>(props: SegmentedProps<T>) {
  const { label, options, value, format, color, onChange } = props
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex overflow-hidden rounded border border-slate-300 bg-white"
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className="px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
            style={selected ? { backgroundColor: color, color: 'white' } : undefined}
          >
            {format(option)}
          </button>
        )
      })}
    </div>
  )
}

// Nail diameter and loading for one view (PRD F4).
export function ScenarioControls({ slot }: { slot: ScenarioSlot }) {
  const scenario = useViewerStore((s) => s.scenarios[slot])
  const setScenario = useViewerStore((s) => s.setScenario)
  const color = SCENARIO_COLORS[slot]
  return (
    <div className="flex flex-wrap gap-2">
      <Segmented
        label={`方案 ${slot} 釘子直徑`}
        options={NAIL_DIAMETERS_MM}
        value={scenario.nailDiameterMm}
        format={(d) => `${d} mm`}
        color={color}
        onChange={(nailDiameterMm) => setScenario(slot, { nailDiameterMm })}
      />
      <Segmented
        label={`方案 ${slot} 負重`}
        options={LOADINGS}
        value={scenario.loading}
        format={(l) => LOADING_LABELS[l]}
        color={color}
        onChange={(loading) => setScenario(slot, { loading })}
      />
    </div>
  )
}
