import { run } from "@gjsify/unit";
import editionBadge from "./services/edition-badge.service.test.ts";
import supportPrompt from "./services/support-prompt.service.test.ts";
import palette from "./preferences/palette.test.ts";

run({ editionBadge, supportPrompt, palette });