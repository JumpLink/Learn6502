import { describe, it, expect } from "@gjsify/unit";
import { purchasedFor, type Channel } from "@gjsify/distribution";
import { EditionBadgeService } from "./edition-badge.service.ts";

export default async () => {
  const service = new EditionBadgeService();
  const badgesFor = (channel: Channel) => service.badges(purchasedFor(channel)).join(",");

  await describe("edition badges — which channel claims a purchase", async () => {
    await it("only the two store channels are bought", async () => {
      const bought: Channel[] = ["microsoft-store", "apple-app-store"];
      const free: Channel[] = ["flathub", "web", "unknown"];
      for (const channel of bought) expect(purchasedFor(channel)).toBe(true);
      for (const channel of free) expect(purchasedFor(channel)).toBe(false);
    });

    await it("an unset channel never claims a purchase", async () => {
      expect(badgesFor("unknown")).toBe("open-source");
    });
  });

  await describe("edition badges — selection", async () => {
    await it("every build is open source", async () => {
      for (const channel of ["flathub", "web", "unknown", "microsoft-store", "apple-app-store"] as Channel[]) {
        expect(service.badges(purchasedFor(channel))[0]).toBe("open-source");
      }
    });

    await it("a free build shows the open-source badge alone", async () => {
      expect(badgesFor("flathub")).toBe("open-source");
      expect(badgesFor("web")).toBe("open-source");
    });

    await it("a bought build adds the purchased badge, after it", async () => {
      expect(badgesFor("microsoft-store")).toBe("open-source,purchased");
      expect(badgesFor("apple-app-store")).toBe("open-source,purchased");
    });
  });
};
