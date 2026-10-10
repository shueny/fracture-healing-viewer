// Fixed page text, kept in one place so tests can check the required wording.

// PRD F7 / CLAUDE.md rule 7: must stay visible on the page.
export const DISCLAIMER = '示意模型，非醫療數據，不作臨床用途'

export const APP_TITLE = '骨折癒合方案比較'
export const APP_SUBTITLE = 'Fracture Healing Comparison Viewer'

// Model credit (ADR 0005). The femur is still the generated placeholder, so
// the page must not credit BodyParts3D for it. Switch this text when the
// real BodyParts3D femur.glb replaces the placeholder.
export const MODEL_CREDIT = '股骨為程式產生的示意幾何模型（非真實解剖資料）'
export const CODE_LICENSE = '程式碼 MIT 授權'
