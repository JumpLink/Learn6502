import { XMLParser } from "fast-xml-parser";

/** A small element tree: `preserveOrder` output is awkward to walk, and order matters for translations. */
export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  /** Concatenated text of this element including nested elements (inline markup is flattened). */
  text: string;
}

type RawNode = Record<string, unknown>;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: false,
  processEntities: true,
  htmlEntities: false,
});

function convert(nodes: RawNode[]): XmlElement[] {
  const elements: XmlElement[] = [];
  for (const node of nodes) {
    const name = Object.keys(node).find((key) => key !== ":@");
    if (!name || name === "#text" || name === "#comment" || name.startsWith("?")) continue;
    const rawAttrs = (node[":@"] ?? {}) as Record<string, string>;
    const attrs: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawAttrs)) attrs[key.replace(/^@_/, "")] = String(value);
    const rawChildren = (node[name] ?? []) as RawNode[];
    const children = convert(rawChildren);
    const element: XmlElement = { name, attrs, children, text: "" };
    element.text = collectText(rawChildren).replace(/\s+/g, " ").trim();
    elements.push(element);
  }
  return elements;
}

function collectText(nodes: RawNode[]): string {
  let text = "";
  for (const node of nodes) {
    const name = Object.keys(node).find((key) => key !== ":@");
    if (name === "#text") text += String(node["#text"]);
    else if (name) text += collectText((node[name] ?? []) as RawNode[]);
  }
  return text;
}

export function parseXml(xml: string): XmlElement {
  const root = convert(parser.parse(xml) as RawNode[]);
  const element = root[0];
  if (!element) throw new Error("XML document has no root element");
  return element;
}

export function child(element: XmlElement, name: string): XmlElement | undefined {
  return element.children.find((candidate) => candidate.name === name);
}

export function childrenNamed(element: XmlElement, name: string): XmlElement[] {
  return element.children.filter((candidate) => candidate.name === name);
}
