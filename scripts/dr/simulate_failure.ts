export interface DRSimulationResult {
  stage: 'simulate';
  ok: boolean;
  message: string;
}

export async function simulateFailure(): Promise<DRSimulationResult> {
  // Staging-safe stub: only logs intent
  return {
    stage: 'simulate',
    ok: true,
    message: 'Simulated primary service failure (staging-safe)',
  };
}

