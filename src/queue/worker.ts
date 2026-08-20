import 'server-only';

/**
 * Queue worker — the long-running process that drives campaigns forward.
 *
 * Run it as a separate process (`npm run worker`) or invoke a single tick via
 * the internal API route (useful on serverless platforms + a cron trigger).
 *
 * On startup it runs recovery to clean up any calls orphaned by an unclean
 * shutdown, guaranteeing no lead is double-dialled after a restart.
 */

import { CampaignEngine } from './engine';
import { SupabaseQueueRepository } from '@/server/supabaseQueueRepository';
import { CallService } from '@/server/callService';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const TICK_INTERVAL_MS = 5000;

export function buildEngine(): CampaignEngine {
  const repo = new SupabaseQueueRepository();
  const callService = new CallService();
  return new CampaignEngine({
    repo,
    placeCall: (claim, campaign) => callService.placeCall(claim, campaign),
  });
}

async function runningCampaignIds(): Promise<string[]> {
  const { data } = await getAdminClient()
    .from('campaigns')
    .select('id')
    .eq('status', 'running');
  return (data ?? []).map((c: { id: string }) => c.id);
}

/** Advance every running campaign by one tick. Also usable from a cron route. */
export async function tickAllCampaigns(engine = buildEngine()): Promise<void> {
  const ids = await runningCampaignIds();
  for (const id of ids) {
    try {
      const outcome = await engine.processCampaignTick(id);
      logger.debug('tick', { campaignId: id, action: outcome.action });
    } catch (err) {
      logger.error('tick.error', {
        campaignId: id,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }
}

async function main() {
  const engine = buildEngine();
  await engine.recover(300);
  logger.info('worker.started', { intervalMs: TICK_INTERVAL_MS });
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await tickAllCampaigns(engine);
    await new Promise((r) => setTimeout(r, TICK_INTERVAL_MS));
  }
}

// Only run the loop when invoked directly (not when imported by a route).
if (require.main === module) {
  main().catch((err) => {
    logger.error('worker.fatal', { error: String(err) });
    process.exit(1);
  });
}
