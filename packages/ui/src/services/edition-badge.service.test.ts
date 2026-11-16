import { describe, it, expect } from "@gjsify/unit";
import { pricing } from "@gjsify/distribution";
import { EditionBadgeService } from "./edition-badge.service.ts";

export default async () => {
  const service = new EditionBadgeService();

  await describe("edition badges — selection", async () => {
    await it("every build is open source", async () => {
      expect(service.badges(false)[0]).toBe("open-source");
      expect(service.badges(true)[0]).toBe("open-source");
    });

    await it("a free build shows the open-source badge alone", async () => {
      expect(service.badges(false).join(",")).toBe("open-source");
    });

    await it("a paid build adds the purchased badge, after it", async () => {
      expect(service.badges(true).join(",")).toBe("open-source,purchased");
    });
  });

  await describe("edition badges — pricing gate", async () => {
    await it("a build without a pricing define is free and claims no purchase", async () => {
      expect(pricing()).toBe("free");
      expect(service.badges(pricing() === "paid").join(",")).toBe("open-source");
    });
  });
};
