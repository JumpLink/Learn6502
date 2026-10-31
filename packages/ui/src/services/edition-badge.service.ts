/**
 * Which edition badges a build shows.
 *
 * Every build of this app is open source and says so. A build the user bought in a store says one
 * thing more: that the purchase supported the open source project. A free build must never claim a
 * purchase, so the decision is the `purchased` capability of `@gjsify/distribution` — never a
 * comparison of the channel name, and never anything the user could toggle.
 *
 * Wording is "Support" and "supported … by buying the app"; never "donation", and no claim about
 * tax-deductibility. The strings themselves live in `@learn6502/ui`, which has the translations;
 * this layer only decides which badges exist, so the order and the gate are testable on their own.
 */
export type EditionBadgeId = "open-source" | "purchased";

export class EditionBadgeService {
  /**
   * The badges to show, in display order. `isPurchased` is `purchased()` from
   * `@gjsify/distribution`; the open-source badge is unconditional.
   */
  public badges(isPurchased: boolean): EditionBadgeId[] {
    return isPurchased ? ["open-source", "purchased"] : ["open-source"];
  }
}

export const editionBadgeService = new EditionBadgeService();
