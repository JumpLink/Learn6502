import type { AppUrls, Branding, DescriptionBlock, Localized, Metainfo, Release } from "./types.ts";
import { child, childrenNamed, parseXml, type XmlElement } from "./xml.ts";

const XML_LANG = "xml:lang";

/**
 * Pairs sibling elements into texts: an element without `xml:lang` opens a new text, the ones with
 * `xml:lang` that follow translate it. This is how `msgfmt --xml` writes translated metainfo.
 */
export function groupLocalized(elements: readonly XmlElement[]): Localized[] {
  const groups: Localized[] = [];
  for (const element of elements) {
    const language = element.attrs[XML_LANG];
    if (language === undefined) {
      groups.push({ source: element.text, byLanguage: {} });
    } else {
      const current = groups.at(-1);
      if (current) current.byLanguage[language] = element.text;
    }
  }
  return groups;
}

function singleLocalized(parent: XmlElement, name: string): Localized | undefined {
  return groupLocalized(childrenNamed(parent, name))[0];
}

function parseBlocks(description: XmlElement | undefined): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  if (!description) return blocks;

  let paragraphGroup: XmlElement[] = [];
  const flushParagraphs = () => {
    for (const text of groupLocalized(paragraphGroup)) blocks.push({ type: "paragraph", text });
    paragraphGroup = [];
  };

  // Translations of a paragraph follow it directly, so consecutive `<p>` elements are grouped and
  // split again whenever a list interrupts them.
  for (const element of description.children) {
    if (element.name === "p") {
      paragraphGroup.push(element);
    } else if (element.name === "ul" || element.name === "ol") {
      flushParagraphs();
      blocks.push({ type: "list", items: groupLocalized(childrenNamed(element, "li")) });
    }
  }
  flushParagraphs();
  return blocks;
}

function parseReleases(releases: XmlElement | undefined): Release[] {
  if (!releases) return [];
  return childrenNamed(releases, "release").map((release) => {
    const timestamp = release.attrs.timestamp;
    const date = release.attrs.date ?? (timestamp ? new Date(Number(timestamp) * 1000).toISOString().slice(0, 10) : "");
    return {
      version: release.attrs.version ?? "",
      date,
      type: release.attrs.type,
      description: parseBlocks(child(release, "description")),
    };
  });
}

/** The colours land in an inline `<style>`, so only plain hex values pass. */
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

function parseBranding(branding: XmlElement | undefined): Branding {
  const result: Branding = {};
  if (!branding) return result;
  for (const color of childrenNamed(branding, "color")) {
    if (color.attrs.type !== "primary" || !HEX_COLOR.test(color.text)) continue;
    if (color.attrs.scheme_preference === "light") result.light = color.text;
    else if (color.attrs.scheme_preference === "dark") result.dark = color.text;
  }
  return result;
}

const URL_KEYS: Record<string, keyof AppUrls> = {
  homepage: "homepage",
  bugtracker: "bugtracker",
  "vcs-browser": "vcsBrowser",
  translate: "translate",
  donation: "donation",
  help: "help",
  faq: "faq",
  contact: "contact",
  contribute: "contribute",
};

/** Links are rendered as `href`, so `javascript:` and friends are dropped. */
const SAFE_URL = /^(https?:|mailto:)/i;

function parseUrls(component: XmlElement): AppUrls {
  const urls: AppUrls = {};
  for (const url of childrenNamed(component, "url")) {
    const key = URL_KEYS[url.attrs.type ?? ""];
    if (key && SAFE_URL.test(url.text)) urls[key] = url.text;
  }
  return urls;
}

/** Reads the parts of an AppStream `<component>` the landing page needs. */
export function parseMetainfo(xml: string): Metainfo {
  const component = parseXml(xml);
  if (component.name !== "component") throw new Error(`Metainfo root must be <component>, got <${component.name}>`);

  const id = child(component, "id")?.text;
  if (!id) throw new Error("Metainfo has no <id>");
  const name = singleLocalized(component, "name");
  if (!name) throw new Error("Metainfo has no <name>");
  const summary = singleLocalized(component, "summary") ?? { source: "", byLanguage: {} };

  const developer = child(component, "developer");
  const developerName = developer ? child(developer, "name")?.text : undefined;

  const screenshots = childrenNamed(child(component, "screenshots") ?? component, "screenshot").map((screenshot) => {
    const images = childrenNamed(screenshot, "image");
    const image = images.find((candidate) => candidate.attrs.type === "source") ?? images[0];
    return { url: image?.text ?? "", caption: singleLocalized(screenshot, "caption") ?? null };
  });

  const contentRating = child(component, "content_rating");
  const attributes: Record<string, string> = {};
  for (const attribute of contentRating ? childrenNamed(contentRating, "content_attribute") : []) {
    if (attribute.attrs.id) attributes[attribute.attrs.id] = attribute.text;
  }

  return {
    id,
    name,
    summary,
    developer: { id: developer?.attrs.id, name: developerName ?? "" },
    description: parseBlocks(child(component, "description")),
    screenshots,
    releases: parseReleases(child(component, "releases")),
    branding: parseBranding(child(component, "branding")),
    urls: parseUrls(component),
    keywords: groupLocalized(childrenNamed(child(component, "keywords") ?? component, "keyword")),
    categories: childrenNamed(child(component, "categories") ?? component, "category").map((category) => category.text),
    projectLicense: child(component, "project_license")?.text,
    metadataLicense: child(component, "metadata_license")?.text,
    contentRating: contentRating ? { type: contentRating.attrs.type ?? "", attributes } : undefined,
  };
}
