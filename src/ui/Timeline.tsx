import { MAX_WEEK, displayWeek } from '../store/timeline'
import { usePlayback, useTimelineKeys } from '../store/usePlayback'
import { useViewerStore } from '../store/useViewerStore'

export function Timeline() {
  const week = useViewerStore((s) => s.week)
  const playing = useViewerStore((s) => s.playing)
  const setWeek = useViewerStore((s) => s.setWeek)
  const togglePlay = useViewerStore((s) => s.togglePlay)
  usePlayback()
  useTimelineKeys()

  return (
    <section
      aria-label="時間軸"
      className="flex items-center gap-4 border-t border-slate-300 bg-white px-4 py-3"
    >
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? '暫停' : '播放'}
        title="空白鍵"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        min={0}
        max={MAX_WEEK}
        step="any" // smooth while playing; dragging snaps to whole weeks
        value={week}
        onChange={(e) => setWeek(Math.round(Number(e.target.value)))}
        aria-label="週數"
        aria-valuetext={`第 ${displayWeek(week)} 週`}
        className="h-2 flex-1 cursor-pointer accent-slate-800"
      />
      <span className="w-28 shrink-0 text-right tabular-nums text-slate-700">
        第 {displayWeek(week)} 週 / {MAX_WEEK}
      </span>
    </section>
  )
}
