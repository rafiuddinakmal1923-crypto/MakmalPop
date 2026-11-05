/**
 * Templates with their scenes, by id. Lane B adds one line for heating when B4 lands:
 *   heating: { ...heatingModel, Scene: HeatingScene },
 */
import type { ExperimentTemplate } from './types'
import { pendulumModel } from './pendulum/model'
import { PendulumScene } from './pendulum/Scene'

export const templates: Record<string, ExperimentTemplate<any>> = {
  pendulum: { ...pendulumModel, Scene: PendulumScene },
}
