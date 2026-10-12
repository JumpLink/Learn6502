/**
 * Hook point for the design phase: arrows and dots on top of the scroll-snap list. Without it the
 * list is a plain horizontal scroller, which already works.
 */
class ScreenshotCarousel extends HTMLElement {
  connectedCallback(): void {
    this.dataset.enhanced = "true";
  }
}

customElements.define("screenshot-carousel", ScreenshotCarousel);
