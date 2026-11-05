/**
 * Template metadata by id, with no React imports, so content validation and tests can use it.
 * Lane B: add `heating: heatingMeta` here when B3 lands (and the circuit meta later).
 */
import type { TemplateMeta } from './types'
import { pendulumMeta } from './pendulum/meta'

export const templateMetas: Record<string, TemplateMeta> = {
  pendulum: pendulumMeta,
}
