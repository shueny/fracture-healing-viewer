import { describe, expect, it } from 'vitest'
import { encodeGlb } from './glb.ts'

const triangle = {
  name: 'tri',
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 2, 0]),
  normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
  indices: new Uint32Array([0, 1, 2]),
}
const material = { name: 'm', baseColor: [1, 1, 1, 1] as [number, number, number, number] }

function readJsonChunk(glb: Uint8Array) {
  const view = new DataView(glb.buffer, glb.byteOffset)
  const length = view.getUint32(12, true)
  return JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + length)))
}

describe('encodeGlb', () => {
  it('writes a valid GLB header and 4-byte aligned chunks', () => {
    const glb = encodeGlb([triangle], material)
    const view = new DataView(glb.buffer)
    expect(view.getUint32(0, true)).toBe(0x46546c67) // "glTF"
    expect(view.getUint32(4, true)).toBe(2)
    expect(view.getUint32(8, true)).toBe(glb.length)

    const jsonLength = view.getUint32(12, true)
    const binLength = view.getUint32(20 + jsonLength, true)
    expect(jsonLength % 4).toBe(0)
    expect(binLength % 4).toBe(0)
    expect(12 + 8 + jsonLength + 8 + binLength).toBe(glb.length)
  })

  it('records POSITION min/max and element counts', () => {
    const json = readJsonChunk(encodeGlb([triangle], material))
    const [position, normal, indices] = json.accessors
    expect(position).toMatchObject({ count: 3, min: [0, 0, 0], max: [1, 2, 0] })
    expect(normal.count).toBe(3)
    expect(indices.count).toBe(3)
    expect(json.buffers[0].byteLength).toBe(36 + 36 + 12)
  })
})
