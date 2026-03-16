/**
 * XP calculation logic for workout sets.
 *
 * Formula: base_xp + weight_bonus + volume_bonus
 *   base_xp      = exercise.xp_per_set
 *   weight_bonus = floor(weight_kg / 20) * 2
 *   volume_bonus = floor(reps / 5) * 1
 *
 * Streak multiplier is applied on top:
 *   >= 7 days: +10%
 *   >= 3 days: +5%
 */

export interface XpCalculationInput {
  xp_per_set:   number
  reps?:         number | null
  weight_kg?:    number | null
  streak_days?:  number
}

export function calculateSetXp(input: XpCalculationInput): number {
  const { xp_per_set, reps, weight_kg, streak_days = 0 } = input

  const base         = xp_per_set
  const weightBonus  = weight_kg  ? Math.floor(weight_kg / 20) * 2  : 0
  const volumeBonus  = reps       ? Math.floor(reps / 5) * 1        : 0

  let xp = base + weightBonus + volumeBonus

  // Apply streak multiplier
  if (streak_days >= 7) {
    xp = Math.round(xp * 1.10)
  } else if (streak_days >= 3) {
    xp = Math.round(xp * 1.05)
  }

  return xp
}

/**
 * Calculate the XP required to reach a given level.
 * Formula: 100 * level^1.6
 */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.6))
}

/**
 * Calculate the level for a given total XP.
 * Iterates until cumulative XP exceeds xp_total.
 */
export function levelForXp(xpTotal: number): number {
  let level = 1
  let cumulative = 0

  while (true) {
    const needed = xpForLevel(level)
    if (cumulative + needed > xpTotal) break
    cumulative += needed
    level++
  }

  return level
}
