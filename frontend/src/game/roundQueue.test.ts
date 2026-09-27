import { describe, expect, it } from 'vitest';
import { AiUnavailableError } from '@/lib/api';
import type { Round } from '@/lib/types';
import { RoundQueue } from './roundQueue';

const round = (n: number): Round => ({
  kind: 'twoTeam',
  conditionA: `A${n}`,
  conditionB: `B${n}`,
  answers: { players: ['P'], verified: true },
});

function scripted(results: (Round | Error)[]) {
  let calls = 0;
  const fetch = async () => {
    const r = results[Math.min(calls++, results.length - 1)];
    if (r instanceof Error) throw r;
    return r;
  };
  return { fetch, calls: () => calls };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('RoundQueue', () => {
  it('fetches in the foreground first, then keeps one round prefetched', async () => {
    const s = scripted([round(1), round(2), round(3)]);
    const queue = new RoundQueue(s.fetch);
    expect((await queue.next()).conditionA).toBe('A1');
    await tick();
    expect(s.calls()).toBe(2);
    expect((await queue.next()).conditionA).toBe('A2');
    await tick();
    expect(s.calls()).toBe(3);
  });

  it('waits for an in-flight prefetch instead of fetching twice', async () => {
    const s = scripted([round(1), round(2), round(3)]);
    const queue = new RoundQueue(s.fetch);
    await queue.next();
    const second = await queue.next();
    expect(second.conditionA).toBe('A2');
    expect(s.calls()).toBe(3);
  });

  it('swallows a failed background prefetch and refetches in the foreground', async () => {
    const s = scripted([round(1), new AiUnavailableError(), round(3)]);
    const queue = new RoundQueue(s.fetch);
    await queue.next();
    await tick();
    expect((await queue.next()).conditionA).toBe('A3');
  });

  it('surfaces a foreground quota error', async () => {
    const queue = new RoundQueue(scripted([new AiUnavailableError(true)]).fetch);
    await expect(queue.next()).rejects.toMatchObject({ quotaExceeded: true });
  });
});
