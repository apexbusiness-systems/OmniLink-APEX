import { simulateFailure } from './simulate_failure';
import { verifyRecovery } from './verify_recovery';
import { recordAuditEvent } from '../../src/security/auditLog';

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

async function main() {
  const dryRun = isDryRun();
  recordAuditEvent({
    actionType: 'dr_test_started',
    resourceType: 'dr',
    resourceId: dryRun ? 'dry-run' : 'live',
  });

  if (!dryRun) {
    console.warn('Running in live mode. Ensure this is intended.');
  }

  const simulate = await simulateFailure();
  console.log('DR Simulate:', simulate);

  await new Promise((res) => setTimeout(res, 500));

  const verify = await verifyRecovery();
  console.log('DR Verify:', verify);

  const ok = simulate.ok && verify.ok;
  recordAuditEvent({
    actionType: 'dr_test_completed',
    resourceType: 'dr',
    resourceId: dryRun ? 'dry-run' : 'live',
    metadata: { ok, checks: verify.checks },
  });

  if (!ok) {
    process.exitCode = 1;
  }
}

main();

