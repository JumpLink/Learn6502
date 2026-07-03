import { Component } from "nano-jsx/esm/index.js";
import { HtmlBox } from "./html-box.component.tsx";
import { Orientation } from "../../enums/gtk.enums.ts";

/**
 * HtmlRoot mirrors GtkRoot/NsRoot: it wraps a whole generated document
 * (tutorial or quick-help) in a single top-level container carrying the
 * view name as a CSS class — exactly like GtkRoot's
 * `<template class={...} parent="MdxView">`.
 *
 * Unlike the GTK target, this does not produce a whole window/page — it is
 * a self-contained HTML fragment (no `<html>`/`<head>`/`<body>`), meant to
 * be mounted into an existing app-web view (e.g. via `element.replaceChildren
 * (...)` on a container, or served as prerendered markup the client
 * hydrates in place) — the same "fragment, not a document" shape as the
 * GTK `.ui` XML being spliced into a larger `MdxView` template.
 */
export class HtmlRoot extends Component {
  render() {
    const classes = ["learn-view", this.props.class].filter(Boolean).join(" ");
    return (
      <HtmlBox class={classes} orientation={Orientation.VERTICAL}>
        {this.props.children}
      </HtmlBox>
    );
  }
}