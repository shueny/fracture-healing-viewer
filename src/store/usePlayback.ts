import { useEffect } from 'react'
import { useViewerStore } from './useViewerStore'

// Drives playback with requestAnimationFrame: each frame advances the week by
// the real time since the last frame, so speed does not depend on frame rate.
export function usePlayback() {
  const playing = useViewerStore((s) => s.playing)
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      useViewerStore.getState().tick((now - last) / 1000)
      last = now
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing])
}

// Space: play / pause. Left / right: one week back / forward.
export function useTimelineKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('select, textarea, input:not([type="range"])')) return
      const { togglePlay, step } = useViewerStore.getState()
      if (e.code === 'Space') togglePlay()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else return
      e.preventDefault() // stop the page scrolling and the slider's own arrows
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
