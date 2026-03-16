import { query } from '../../db/pool'
import type { WorkoutTemplate, TemplateExercise, Exercise } from '../../types'

export type TemplateWithExercises = WorkoutTemplate & {
  exercises: (TemplateExercise & { exercise: Exercise })[]
}

// ── List all active templates ─────────────────────────────────

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const result = await query<WorkoutTemplate>(
    `SELECT * FROM workout_templates
     WHERE is_active = TRUE
     ORDER BY difficulty ASC, name ASC`
  )
  return result.rows
}

// ── Get template with full exercise list ─────────────────────

export async function getTemplate(id: string): Promise<TemplateWithExercises | null> {
  const templateResult = await query<WorkoutTemplate>(
    'SELECT * FROM workout_templates WHERE id = $1 AND is_active = TRUE',
    [id]
  )
  const template = templateResult.rows[0]
  if (!template) return null

  const exercisesResult = await query<TemplateExercise & { exercise: Exercise }>(
    `SELECT
       te.*,
       row_to_json(e) AS exercise
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = $1
     ORDER BY te.order_index ASC`,
    [id]
  )

  return { ...template, exercises: exercisesResult.rows }
}
