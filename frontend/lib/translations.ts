// ── Muscle group translations ─────────────────────────────────
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest:           'Brust',
  triceps:         'Trizeps',
  shoulders:       'Schultern',
  back:            'Rücken',
  biceps:          'Bizeps',
  quads:           'Quadrizeps',
  glutes:          'Gesäss',
  hamstrings:      'Oberschenkel hinten',
  calves:          'Waden',
  core:            'Core',
  abs:             'Bauch',
  obliques:        'Seitliche Bauchmuskulatur',
  traps:           'Trapez',
  forearms:        'Unterarme',
  hip_flexors:     'Hüftbeuger',
  full_body:       'Ganzkörper',
  cardiovascular:  'Herz-Kreislauf',
  legs:            'Beine',
}

export function translateMuscleGroups(groups: string[]): string {
  return groups
    .slice(0, 3)
    .map((g) => MUSCLE_GROUP_LABELS[g] ?? g)
    .join(', ')
}

// ── Exercise category translations ───────────────────────────
export const CATEGORY_LABELS: Record<string, string> = {
  strength:    'Kraft',
  cardio:      'Cardio',
  core:        'Core',
  flexibility: 'Dehnung',
  sport:       'Sport',
  custom:      'Sonstiges',
  alle:        'Alle',
}
