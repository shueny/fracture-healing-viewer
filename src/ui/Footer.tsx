import { CODE_LICENSE, DISCLAIMER, MODEL_CREDIT } from './copy'

export function Footer() {
  return (
    <footer className="flex flex-wrap gap-x-4 border-t border-slate-200 bg-slate-50 px-4 py-1 text-xs text-slate-500">
      <span>{MODEL_CREDIT}</span>
      <span>{CODE_LICENSE}</span>
      <span>{DISCLAIMER}</span>
    </footer>
  )
}
