import { Gtk, AdwCard } from "@gjsify/adwaita-web";

/** The parts of a monospace code card with a floating copy button. */
export interface CodeCard {
  card: AdwCard;
  code: HTMLElement;
  copyButton: Gtk.Button;
}

/**
 * Build an `<adw-card>` wrapping a `<pre><code>` block with a flat copy button
 * in the top-right corner — the web idiom for the copy affordance the GNOME
 * SourceView button and the Android tap-to-copy gesture provide.
 */
export function buildCodeCard(copyTooltip: string): CodeCard {
  const card = new AdwCard();
  card.className = "learn-code-card";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  pre.appendChild(code);

  const copyButton = new Gtk.Button();
  copyButton.className = "learn-copy-button";
  copyButton.setAttribute("icon", "edit-copy");
  copyButton.setAttribute("flat", "");
  copyButton.setAttribute("tooltip", copyTooltip);

  card.append(pre, copyButton);
  return { card, code, copyButton };
}
