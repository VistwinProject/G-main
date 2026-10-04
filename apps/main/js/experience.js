// Whole-experience lifecycle, deliberately independent of WS connectivity and mute.
export function experienceStatus({ page, narration, autorun = false }) {
  if (autorun) return { experience: 'active', reason: 'autorun-running' };
  const matching = narration?.page === page;
  if (page === 'outro' && matching && narration.finished && narration.completion) {
    return { experience: 'complete', reason: 'outro-media-ended', completion: narration.completion };
  }
  if (page === 'intro' && matching && (narration.finished || narration.stopped)) {
    return { experience: 'idle', reason: narration.finished ? 'intro-media-ended' : 'intro-explicitly-stopped' };
  }
  return { experience: 'active', reason: page === 'intro' ? 'intro-narration-unfinished' : 'experience-unfinished' };
}
