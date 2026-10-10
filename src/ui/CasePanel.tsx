import { SCENARIO_FILE } from '../data/scenarios'

const BONE_LABELS: Record<string, string> = { femur: '股骨幹骨折' }
const FIXATION_LABELS: Record<string, string> = { 'intramedullary nail': '髓內釘固定' }

// PRD F1: the one fixed demo case, read from scenarios.json.
export function CasePanel() {
  const c = SCENARIO_FILE.case
  const rows: [string, string][] = [
    ['部位', BONE_LABELS[c.bone] ?? c.bone],
    ['骨折間隙', `${c.fractureGapMm} mm`],
    ['固定方式', FIXATION_LABELS[c.fixation] ?? c.fixation],
    ['比較變因', '釘子直徑 · 負重'],
  ]
  return (
    <section aria-labelledby="case-title">
      <h2 id="case-title" className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
        案例資訊
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
