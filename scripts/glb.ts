// Minimal GLB (binary glTF 2.0) writer for indexed triangle meshes.
// Spec: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification

export interface GlbMesh {
  name: string
  positions: Float32Array // xyz per vertex
  normals: Float32Array // xyz per vertex, unit length
  indices: Uint32Array // 3 per triangle
}

export interface GlbMaterial {
  name: string
  baseColor: [number, number, number, number] // linear RGBA, 0..1
}

const GLB_MAGIC = 0x46546c67 // "glTF"
const CHUNK_JSON = 0x4e4f534a // "JSON"
const CHUNK_BIN = 0x004e4942 // "BIN\0"
const FLOAT = 5126
const UNSIGNED_INT = 5125
const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963

const pad4 = (n: number) => (n + 3) & ~3

function minMaxVec3(values: Float32Array) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < values.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      min[c] = Math.min(min[c], values[i + c])
      max[c] = Math.max(max[c], values[i + c])
    }
  }
  return { min, max }
}

export function encodeGlb(meshes: GlbMesh[], material: GlbMaterial): Uint8Array {
  const bufferViews: object[] = []
  const accessors: object[] = []
  const binParts: Uint8Array[] = []
  let byteOffset = 0

  // Every array here uses 4-byte elements, so offsets stay 4-byte aligned.
  const addView = (data: Float32Array | Uint32Array, target: number) => {
    binParts.push(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
    bufferViews.push({ buffer: 0, byteOffset, byteLength: data.byteLength, target })
    byteOffset += data.byteLength
    return bufferViews.length - 1
  }

  const gltfMeshes = meshes.map((mesh) => {
    const vertexCount = mesh.positions.length / 3
    const position =
      accessors.push({
        bufferView: addView(mesh.positions, ARRAY_BUFFER),
        componentType: FLOAT,
        count: vertexCount,
        type: 'VEC3',
        ...minMaxVec3(mesh.positions), // required for POSITION
      }) - 1
    const normal =
      accessors.push({
        bufferView: addView(mesh.normals, ARRAY_BUFFER),
        componentType: FLOAT,
        count: vertexCount,
        type: 'VEC3',
      }) - 1
    const indices =
      accessors.push({
        bufferView: addView(mesh.indices, ELEMENT_ARRAY_BUFFER),
        componentType: UNSIGNED_INT,
        count: mesh.indices.length,
        type: 'SCALAR',
      }) - 1
    return {
      name: mesh.name,
      primitives: [{ attributes: { POSITION: position, NORMAL: normal }, indices, material: 0 }],
    }
  })

  const json = {
    asset: { version: '2.0', generator: 'fracture-healing-viewer placeholder' },
    scene: 0,
    scenes: [{ nodes: meshes.map((_, i) => i) }],
    nodes: meshes.map((mesh, i) => ({ name: mesh.name, mesh: i })),
    meshes: gltfMeshes,
    materials: [
      {
        name: material.name,
        pbrMetallicRoughness: {
          baseColorFactor: material.baseColor,
          metallicFactor: 0,
          roughnessFactor: 0.8,
        },
      },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  }

  // JSON chunk is padded with spaces, BIN chunk with zeros (both to 4 bytes).
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json))
  const jsonLength = pad4(jsonBytes.length)
  const binLength = pad4(byteOffset)
  const totalLength = 12 + 8 + jsonLength + 8 + binLength

  const out = new Uint8Array(totalLength)
  const view = new DataView(out.buffer)
  view.setUint32(0, GLB_MAGIC, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, totalLength, true)

  view.setUint32(12, jsonLength, true)
  view.setUint32(16, CHUNK_JSON, true)
  out.fill(0x20, 20, 20 + jsonLength)
  out.set(jsonBytes, 20)

  const binStart = 20 + jsonLength
  view.setUint32(binStart, binLength, true)
  view.setUint32(binStart + 4, CHUNK_BIN, true)
  let cursor = binStart + 8
  for (const part of binParts) {
    out.set(part, cursor)
    cursor += part.length
  }
  return out
}
