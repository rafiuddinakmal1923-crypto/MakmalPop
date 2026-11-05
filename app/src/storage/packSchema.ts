/**
 * Content pack schema (SDS 4.1, build prompt section 8). Lane A owns this file.
 *
 * Packs hold text, ranges and questions only. Physics lives in the templates.
 */
import { z } from 'zod'
import { templateMetas } from '../experiments/metas'

/** Student-facing text. `ms` is required; `en` may be empty until the English pass (the app falls back to ms). */
export const textSchema = z.object({ ms: z.string().min(1), en: z.string() })
export type Text = z.infer<typeof textSchema>

const choiceSchema = z
  .object({
    question: textSchema,
    options: z.array(textSchema).min(2).max(4),
    answer: z.number().int().min(0),
  })
  .refine((c) => c.answer < c.options.length, { message: 'answer is not a valid option index', path: ['answer'] })

const classRoundSchema = z
  .object({
    question: textSchema,
    options: z.array(textSchema).min(2).max(4),
    answer: z.number().int().min(0),
    settings: z.record(z.string(), z.number()).optional(),
  })
  .refine((c) => c.answer < c.options.length, { message: 'answer is not a valid option index', path: ['answer'] })

const mistakeSchema = z
  .object({
    id: z.string(),
    reasons: z.array(textSchema).length(3),
    answer: z.number().int().min(0).max(2),
  })

export const pageSchema = z
  .object({
    pageId: z.string().regex(/^[a-z0-9-]+$/),
    template: z.string(),
    chapter: z.object({ form: z.union([z.literal(4), z.literal(5)]), number: z.number().int().min(1).max(7), title: textSchema }),
    subtopic: textSchema,
    title: textSchema,
    concept: z.array(textSchema).min(1).max(4),
    mission: textSchema,
    variables: z.object({
      manipulated: z.string(),
      responding: z.string(),
      constant: z.array(z.string()).min(1),
    }),
    ranges: z.record(z.string(), z.tuple([z.number(), z.number()])),
    prediction: choiceSchema,
    explain: choiceSchema,
    formula: z.object({ latex: z.string().min(1), unlockGraph: z.string() }),
    classRounds: z.array(classRoundSchema).length(3),
    mistakes: z.array(mistakeSchema).max(3),
    reviewedBy: z.string().nullable(),
  })
  .superRefine((page, ctx) => {
    const meta = templateMetas[page.template]
    if (!meta) {
      ctx.addIssue({ code: 'custom', message: `unknown template "${page.template}"`, path: ['template'] })
      return
    }
    const vars = [page.variables.manipulated, page.variables.responding, ...page.variables.constant]
    vars.forEach((v, i) => {
      if (!meta.variableIds.includes(v)) ctx.addIssue({ code: 'custom', message: `unknown variable "${v}"`, path: ['variables', i] })
    })
    if (new Set(vars).size !== vars.length) ctx.addIssue({ code: 'custom', message: 'a variable is used twice', path: ['variables'] })
    const graph = meta.graphs.find((g) => g.id === page.formula.unlockGraph)
    if (!graph) ctx.addIssue({ code: 'custom', message: `unknown graph "${page.formula.unlockGraph}"`, path: ['formula', 'unlockGraph'] })
    else if (!graph.straight) ctx.addIssue({ code: 'custom', message: 'unlockGraph must be a straight-line graph', path: ['formula', 'unlockGraph'] })
    page.mistakes.forEach((m, i) => {
      if (!meta.mistakeIds.includes(m.id)) ctx.addIssue({ code: 'custom', message: `unknown mistake "${m.id}"`, path: ['mistakes', i, 'id'] })
    })
    for (const [key, [lo, hi]] of Object.entries(page.ranges)) {
      const control = meta.controls.find((c) => c.key === key)
      if (!control) ctx.addIssue({ code: 'custom', message: `unknown control "${key}"`, path: ['ranges', key] })
      else if (lo >= hi || lo < control.safeMin || hi > control.safeMax)
        ctx.addIssue({ code: 'custom', message: `range for ${key} must sit inside ${control.safeMin}-${control.safeMax}`, path: ['ranges', key] })
    }
  })

export const packSchema = z
  .object({
    packId: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    curriculum: z.string(),
    pages: z.array(pageSchema),
  })
  .superRefine((pack, ctx) => {
    const ids = pack.pages.map((p) => p.pageId)
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'duplicate pageId', path: ['pages'] })
  })

export type Page = z.infer<typeof pageSchema>
export type Pack = z.infer<typeof packSchema>
