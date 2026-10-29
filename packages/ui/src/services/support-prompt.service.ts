/**
 * The support prompt: one friendly, dismissible note after the learner finishes the first tutorial
 * chapter, once per calendar year, and only where the distribution channel allows donation UI.
 *
 * Support is income for the maker, never a "Spende" and never tax-deductible; no wording may
 * suggest otherwise. The year is recorded when the prompt is claimed, not when it is answered: a
 * crash or force-quit must not turn one missed prompt into a prompt on every start.
 */

/** Where the shown years live; GNOME backs it with GSettings. */
export interface SupportPromptStore {
  read(): number[];
  write(years: number[]): void;
}

export class SupportPromptService {
  /**
   * Whether to ask now: the channel allows it (`allowed`, i.e. `donationsAllowed()`) and this
   * calendar year has not been asked about yet. Pure, so the decision is testable without storage.
   */
  public shouldPrompt(allowed: boolean, shownYears: readonly number[], year: number): boolean {
    return allowed && !shownYears.includes(year);
  }

  /** The ledger with `year` added, sorted and without duplicates. */
  public withYear(shownYears: readonly number[], year: number): number[] {
    return [...new Set([...shownYears, year])].sort((a, b) => a - b);
  }

  /**
   * Decide against the real store and, when the answer is yes, record the year immediately.
   * Returns whether the caller should show the prompt. Never throws: a store that cannot be
   * written must not break learning, it only means the prompt may come again.
   */
  public claim(store: SupportPromptStore, allowed: boolean, year: number): boolean {
    try {
      const shown = store.read();
      if (!this.shouldPrompt(allowed, shown, year)) return false;
      store.write(this.withYear(shown, year));
      return true;
    } catch (error) {
      console.error(`[support] could not record the prompt: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }
}

export const supportPromptService = new SupportPromptService();
