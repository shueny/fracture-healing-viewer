import { TISSUES } from '../scene/callusModel'

// PRD F6: tissue colour scale for the callus, in healing order. Colours come
// from the same constants the shader uses.
export function Legend() {
  return (
    <section aria-labelledby="legend-title">
      <h2 id="legend-title" className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
        骨痂組織狀態
      </h2>
      <ol className="space-y-1.5 text-sm">
        {TISSUES.map((t) => (
          <li key={t.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3.5 w-6 rounded-sm border border-black/10"
              style={{ backgroundColor: t.color }}
            />
            <span className="text-slate-800">{t.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">隨時間由外緣往骨折線骨化</p>
    </section>
  )
}
