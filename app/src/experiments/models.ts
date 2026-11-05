/**
 * Physics models by template id, with no React imports (used by the game store and tests).
 * Lane B: add `heating: heatingModel` here when B3 lands.
 */
import { pendulumModel } from './pendulum/model'
import type { TemplateModel } from './types'

export const templateModels: Record<string, TemplateModel<any>> = {
  pendulum: pendulumModel,
}

export function getModel(templateId: string): TemplateModel<any> {
  const m = templateModels[templateId]
  if (!m) throw new Error(`No model for template "${templateId}"`)
  return m
}
