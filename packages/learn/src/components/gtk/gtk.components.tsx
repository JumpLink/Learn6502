import type { MDXComponents } from 'mdx/types'

import { GtkLabel } from './gtk-label.component.tsx'
import { GtkRoot } from './gtk-root.component.tsx'

export const GtkComponents: MDXComponents = {
    GtkRoot,
    GtkLabel,
    h1: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-1">{props.children}</GtkLabel>,
    h2: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-2">{props.children}</GtkLabel>,
    h3: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-3">{props.children}</GtkLabel>,
    h4: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-4">{props.children}</GtkLabel>,
    h5: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-5">{props.children}</GtkLabel>,
    h6: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12" class="title-6">{props.children}</GtkLabel>,
    p: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12">{props.children}</GtkLabel>,
    pre: (props: any) => <GtkLabel use-markup wrap vexpand-set vexpand justify="fill" margin-top="12" margin-bottom="12">{props.children}</GtkLabel>,
    code: (props: any) => props.children,
    ol: (props: any) => props.children,
    ul: (props: any) => props.children,
    li: (props: any) => props.children,
    img: (props: any) => props.children,
    table: (props: any) => props.children,
    tr: (props: any) => props.children,
    td: (props: any) => props.children,
    th: (props: any) => props.children,
    em: (props: any) => props.children,
    strong: (props: any) => <b>{props.children}</b>,
    Tutorial: (props: any) => props.children
}
