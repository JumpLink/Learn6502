import type { MDXComponents } from "mdx/types";

import { HtmlLabel } from "./html-label.component.tsx";
import { HtmlRoot } from "./html-root.component.tsx";
import { HtmlPre } from "./html-pre.compontent.tsx";
import { HtmlTextList } from "./html-text-list.compontent.tsx";
import { HtmlCode } from "./html-code.compontent.tsx";
import { TextListType } from "../../enums/gtk.enums.ts";

/**
 * MDX -> HTML component map. Mirrors GtkComponents' shape and coverage
 * (same element set: headings, paragraphs, code, lists, sub/sup, em/strong)
 * but leaves plain-passthrough elements (`a`, `img`, `table`/`tr`/`td`/`th`)
 * unmapped — MDX already renders those as real, semantic HTML by default,
 * which is exactly what we want here (unlike the GTK target, which has no
 * native anchor/table widget and must fold or drop them).
 */
export const HtmlComponents: MDXComponents = {
  HtmlRoot,
  HtmlLabel,
  h1: (props: any) => (
    <HtmlLabel {...props} tag="h1" class="title-1">
      {props.children}
    </HtmlLabel>
  ),
  h2: (props: any) => (
    <HtmlLabel {...props} tag="h2" class="title-2">
      {props.children}
    </HtmlLabel>
  ),
  h3: (props: any) => (
    <HtmlLabel {...props} tag="h3" class="title-3">
      {props.children}
    </HtmlLabel>
  ),
  h4: (props: any) => (
    <HtmlLabel {...props} tag="h4" class="title-4">
      {props.children}
    </HtmlLabel>
  ),
  p: (props: any) => (
    <HtmlLabel {...props} tag="p" class="body">
      {props.children}
    </HtmlLabel>
  ),
  pre: HtmlPre,
  code: HtmlCode,
  ol: (props: any) => (
    <HtmlTextList {...props} type={TextListType.ORDERED}>
      {props.children}
    </HtmlTextList>
  ),
  ul: (props: any) => (
    <HtmlTextList {...props} type={TextListType.UNORDERED}>
      {props.children}
    </HtmlTextList>
  ),
  li: (props: any) => <li>{props.children}</li>,
  sub: (props: any) => <sub {...props}>{props.children}</sub>,
  sup: (props: any) => <sup {...props}>{props.children}</sup>,
  em: (props: any) => <em {...props}>{props.children}</em>,
  strong: (props: any) => <strong {...props}>{props.children}</strong>,
};