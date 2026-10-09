import { describe, expect, it } from 'vitest'
import { TISSUES } from '../scene/callusModel'
import { DISCLAIMER, MODEL_CREDIT } from './copy'

describe('required page text', () => {
  it('uses the exact disclaimer wording from the PRD', () => {
    expect(DISCLAIMER).toBe('示意模型，非醫療數據，不作臨床用途')
  })

  it('does not credit BodyParts3D while the femur is the placeholder (ADR 0005)', () => {
    expect(MODEL_CREDIT).not.toContain('BodyParts3D')
  })

  it('legend lists the four PRD tissue states in healing order', () => {
    expect(TISSUES.map((t) => t.label)).toEqual(['纖維組織', '軟骨', '編織骨', '成熟骨'])
  })
})
