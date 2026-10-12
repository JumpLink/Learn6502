/**
 * Enhances the server-rendered download split-button: the primary link is swapped for the target
 * that fits the visitor's OS. Without JavaScript the rendered link and the full list still work.
 */
function detectOs(): string {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.userAgent;
  if (/android/i.test(platform)) return "android";
  if (/mac|iphone|ipad/i.test(platform)) return "darwin";
  if (/win/i.test(platform)) return "win32";
  return "linux";
}

class AppDownload extends HTMLElement {
  connectedCallback(): void {
    const button = this.querySelector<HTMLAnchorElement>("a.button");
    const match = this.querySelector<HTMLElement>(`li[data-os="${detectOs()}"][data-recommended] a`);
    if (!button || !match) return;
    button.href = (match as HTMLAnchorElement).href;
    button.textContent = match.textContent;
  }
}

customElements.define("app-download", AppDownload);
