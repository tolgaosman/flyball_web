import type { Round } from '@/lib/types';

/**
 * Keeps one party round ready ahead of the one on screen, so "NEW ROUND"
 * usually lands instantly. (The server keeps its own buffer too.)
 */
export class RoundQueue {
  private buffered: Round | null = null;
  private prefetching: Promise<void> | null = null;

  /** fetch rejects with AiUnavailableError on failure. */
  constructor(private readonly fetch: () => Promise<Round>) {}

  /** The next round; rejects (AiUnavailableError) only when a foreground fetch fails. */
  async next(): Promise<Round> {
    if (!this.buffered && this.prefetching) await this.prefetching;
    const round = this.buffered ?? (await this.fetch());
    this.buffered = null;
    this.topUp();
    return round;
  }

  private topUp() {
    if (this.buffered || this.prefetching) return;
    // Settle both fields in the same callback: a separate .finally() runs a
    // microtask later and would make the next topUp() see a stale in-flight flag.
    this.prefetching = this.fetch().then(
      (round) => {
        this.buffered = round;
        this.prefetching = null;
      },
      // Background prefetch: nobody to show an error to. The next
      // foreground next() fetches again and surfaces the real error.
      () => {
        this.prefetching = null;
      },
    );
  }
}
