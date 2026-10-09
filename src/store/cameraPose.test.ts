import { beforeEach, describe, expect, it } from 'vitest'
import { CALLUS } from '../scene/callusModel'
import { CAMERA_FOV_DEG, INITIAL_CAMERA, framingDistance, nextCameraPose } from './cameraPose'
import { useViewerStore } from './useViewerStore'

describe('shared camera pose', () => {
  it('bumps the version only when the pose really changes', () => {
    const moved = nextCameraPose(INITIAL_CAMERA, [10, 0, 700], [0, 0, 0])
    expect(moved.version).toBe(1)
    expect(nextCameraPose(moved, [10, 0, 700], [0, 0, 0])).toBe(moved) // echo: no change
    expect(nextCameraPose(moved, [10, 0, 700.00001], [0, 0, 0])).toBe(moved) // below epsilon
    expect(nextCameraPose(moved, [10, 0, 700], [0, 5, 0]).version).toBe(2) // pan
  })

  describe('in the store', () => {
    beforeEach(() => useViewerStore.setState({ camera: INITIAL_CAMERA }))

    it('one view writing makes the pose available to the other', () => {
      useViewerStore.getState().setCamera([100, 50, 600], [0, 10, 0])
      expect(useViewerStore.getState().camera).toEqual({
        position: [100, 50, 600],
        target: [0, 10, 0],
        version: 1,
      })
    })

    it('the other view echoing the same pose does not trigger another update', () => {
      const { setCamera } = useViewerStore.getState()
      setCamera([100, 50, 600], [0, 10, 0])
      setCamera([100, 50, 600], [0, 10, 0])
      expect(useViewerStore.getState().camera.version).toBe(1)
    })
  })
})

describe('initial framing', () => {
  it('distance shows exactly the requested half height', () => {
    const d = framingDistance(60)
    expect(d * Math.tan(((CAMERA_FOV_DEG / 2) * Math.PI) / 180)).toBeCloseTo(60)
  })

  it('starts on the fracture line, close enough to see the whole callus large', () => {
    expect(INITIAL_CAMERA.target).toEqual([0, 0, 0])
    const halfHeight = INITIAL_CAMERA.position[2] * Math.tan(((CAMERA_FOV_DEG / 2) * Math.PI) / 180)
    expect(halfHeight).toBeGreaterThan(CALLUS.halfLengthMm)
    expect(halfHeight).toBeLessThan(100) // far less than the 400 mm femur
  })
})
