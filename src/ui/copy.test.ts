import { describe, expect, it } from 'vitest'
import { TISSUES } from '../scene/callusModel'
import { DISCLAIMER, MODEL_CREDIT } from './copy'

describe('required page text', () => {
  it('uses the exact disclaimer wording from the PRD', () => {
    expect(DISCLAIMER).toBe('示意模型，非醫療數據，不作臨床用途')
  })

  it('credits BodyParts3D, its licence, and says the model was modified (ADR 0019)', () => {
    for (const part of ['BodyParts3D', 'Database Center for Life Science', 'CC BY 4.0', '修改']) {
      expect(MODEL_CREDIT).toContain(part)
    }
  })

  it('legend lists the four PRD tissue states in healing order', () => {
    expect(TISSUES.map((t) => t.label)).toEqual(['纖維組織', '軟骨', '編織骨', '成熟骨'])
  })
})
