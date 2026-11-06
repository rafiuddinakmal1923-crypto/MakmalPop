/**
 * Template metadata by id, with no React imports, so content validation and tests can use it.
 * Lane B: add the circuit meta here later.
 */
import type { TemplateMeta } from './types'
import { heatingMeta } from './heating/meta'
import { pendulumMeta } from './pendulum/meta'

export const templateMetas: Record<string, TemplateMeta> = {
  pendulum: pendulumMeta,
  heating: heatingMeta,
}
