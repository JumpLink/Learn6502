import { describe, it, expect } from "@gjsify/unit";
import { donationsAllowedFor, type Channel } from "@gjsify/distribution";
import { SupportPromptService, type SupportPromptStore } from "./support-prompt.service.ts";

const memoryStore = (initial: number[] = []): SupportPromptStore & { years: number[] } => {
  const store = {
    years: initial,
    read: () => store.years,
    write: (years: number[]) => {
      store.years = years;
    },
  };
  return store;
};

export default async () => {
  const service = new SupportPromptService();

  await describe("support prompt — channel gating", async () => {
    await it("free channels allow it, store channels and unset builds never do", async () => {
      const allowed: Channel[] = ["flathub", "web"];
      const blocked: Channel[] = ["microsoft-store", "apple-app-store", "unknown"];
      for (const c of allowed) expect(donationsAllowedFor(c)).toBe(true);
      for (const c of blocked) expect(donationsAllowedFor(c)).toBe(false);
    });

    await it("a blocked channel never prompts, even for a year not yet shown", async () => {
      expect(service.shouldPrompt(donationsAllowedFor("microsoft-store"), [], 2026)).toBe(false);
      expect(service.shouldPrompt(donationsAllowedFor("unknown"), [], 2026)).toBe(false);
      expect(service.shouldPrompt(donationsAllowedFor("flathub"), [], 2026)).toBe(true);
    });
  });

  await describe("support prompt — once per calendar year", async () => {
    await it("asks the first time in a year, then never again in that year", async () => {
      const store = memoryStore();
      expect(service.claim(store, true, 2026)).toBe(true);
      expect(service.claim(store, true, 2026)).toBe(false);
      expect(JSON.stringify(store.years)).toBe(JSON.stringify([2026]));
    });

    await it("the next year asks again, and the ledger stays sorted", async () => {
      const store = memoryStore();
      expect(service.claim(store, true, 2026)).toBe(true);
      expect(service.claim(store, true, 2025)).toBe(true);
      expect(service.claim(store, true, 2027)).toBe(true);
      expect(JSON.stringify(store.years)).toBe(JSON.stringify([2025, 2026, 2027]));
    });

    await it("a blocked channel records nothing, so a later free build still asks", async () => {
      const store = memoryStore();
      expect(service.claim(store, false, 2026)).toBe(false);
      expect(store.years.length).toBe(0);
      expect(service.claim(store, true, 2026)).toBe(true);
    });

    await it("a store that cannot be written does not throw and does not prompt", async () => {
      const broken: SupportPromptStore = {
        read: () => [],
        write: () => {
          throw new Error("read-only");
        },
      };
      expect(service.claim(broken, true, 2026)).toBe(false);
    });
  });
};
