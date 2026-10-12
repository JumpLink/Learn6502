import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { hasTransparentBorder } from "./images.ts";

const solid = (alpha: 0 | 1, background = { r: 200, g: 100, b: 50 }) =>
  sharp({ create: { width: 8, height: 6, channels: 4, background: { ...background, alpha } } })
    .png()
    .toBuffer();

test("a window shot with transparent corners brings its own frame", async () => {
  assert.equal(await hasTransparentBorder(await solid(0)), true);
});

test("an opaque screenshot gets the page's frame", async () => {
  assert.equal(await hasTransparentBorder(await solid(1)), false);
});

test("an image without an alpha channel is opaque", async () => {
  const jpeg = await sharp({ create: { width: 8, height: 6, channels: 3, background: "#336699" } }).png().toBuffer();
  assert.equal(await hasTransparentBorder(jpeg), false);
});

test("a transparent border with an opaque centre still counts", async () => {
  const centre = await sharp({ create: { width: 4, height: 2, channels: 4, background: "#fff" } }).png().toBuffer();
  const framed = await sharp({ create: { width: 8, height: 6, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: centre, left: 2, top: 2 }])
    .png()
    .toBuffer();
  assert.equal(await hasTransparentBorder(framed), true);
});
