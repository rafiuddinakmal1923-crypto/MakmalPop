/** Templates with their scenes, by id. Add new templates here (Ohm's law circuit later). */
import type { ExperimentTemplate } from './types'
import { heatingModel } from './heating/model'
import { HeatingScene } from './heating/Scene'
import { pendulumModel } from './pendulum/model'
import { PendulumScene } from './pendulum/Scene'

export const templates: Record<string, ExperimentTemplate<any>> = {
  pendulum: { ...pendulumModel, Scene: PendulumScene },
  heating: { ...heatingModel, Scene: HeatingScene },
}
