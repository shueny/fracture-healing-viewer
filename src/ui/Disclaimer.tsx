import { DISCLAIMER } from './copy'

// PRD F7: always visible in the header, never dismissible.
export function Disclaimer() {
  return (
    <p
      role="note"
      className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900"
    >
      ⚠ {DISCLAIMER}
    </p>
  )
}
