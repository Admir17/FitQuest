// ── Sound effects using Web Audio API ────────────────────────
// No external dependencies — pure browser audio synthesis

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine'
) {
  const ctx  = getCtx()
  const osc  = ctx.createOscillator()
  const vol  = ctx.createGain()

  osc.connect(vol)
  vol.connect(ctx.destination)

  osc.type      = type
  osc.frequency.setValueAtTime(frequency, startTime)

  vol.gain.setValueAtTime(0, startTime)
  vol.gain.linearRampToValueAtTime(gain, startTime + 0.01)
  vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playAchievementSound() {
  try {
    const ctx  = getCtx()
    const now  = ctx.currentTime

    // Ascending three-note chime: C5 → E5 → G5
    playTone(523, now,        0.15, 0.3)
    playTone(659, now + 0.12, 0.15, 0.3)
    playTone(784, now + 0.24, 0.3,  0.35)
  } catch { /* Audio not supported */ }
}

export function playLevelUpSound() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    // Triumphant ascending fanfare
    playTone(392, now,        0.1,  0.2)
    playTone(523, now + 0.1,  0.1,  0.2)
    playTone(659, now + 0.2,  0.1,  0.2)
    playTone(784, now + 0.3,  0.4,  0.35)
    playTone(1046,now + 0.35, 0.5,  0.3)
  } catch { /* Audio not supported */ }
}
