import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import Template from "./page-stack.blp";

export type PageStackPage = {
  name: string;
  title: string;
  iconName?: string;
  widget: Gtk.Widget;
};

/**
 * PageStack
 *
 * Reusable ViewStack + ViewSwitcherBar wrapper.
 * Allows setting pages programmatically and switching by name.
 */
export class PageStack extends Adw.Bin {
  declare private _stack: Adw.ViewStack;

  static {
    GObject.registerClass(
      {
        GTypeName: "PageStack",
        Template,
        InternalChildren: ["stack"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
  }

  /** Replace all pages with the provided list. */
  public setPages(pages: PageStackPage[]): void {
    // Remove existing pages via pages model
    const children: Gtk.Widget[] = [];
    const model: any = (this._stack as any).get_pages?.();
    if (model) {
      const n: number = model.get_n_items?.() ?? 0;
      for (let i = 0; i < n; i++) {
        const page: any = model.get_item?.(i);
        const child: Gtk.Widget | undefined = page?.get_child?.();
        if (child) children.push(child);
      }
    }
    for (const child of children) {
      this._stack.remove(child);
    }

    // Add new pages
    for (const page of pages) {
      if (page.iconName) {
        this._stack.add_titled_with_icon?.(
          page.widget,
          page.name,
          page.title,
          page.iconName
        );
      } else {
        this._stack.add_titled(page.widget, page.name, page.title);
      }
    }
  }

  /** Switch to a page by name if it exists. */
  public showPage(name: string): void {
    this._stack.set_visible_child_name(name);
  }

  /** Get the underlying stack for advanced scenarios. */
  public get stack(): Adw.ViewStack {
    return this._stack;
  }
}

GObject.type_ensure(PageStack.$gtype);
