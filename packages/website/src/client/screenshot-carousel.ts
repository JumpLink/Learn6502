import { enhanceDialog } from "./dialog.ts";

/**
 * Arrows, dots and a fullscreen view on top of the scroll-snap track. The controls are rendered
 * hidden by the build — their labels are translated there — and only unhidden here, so the
 * component adds behaviour and never markup. Without it the track is still a scroller.
 */
class ScreenshotCarousel extends HTMLElement {
  connectedCallback(): void {
    const track = this.querySelector<HTMLElement>(".carousel-track");
    const slides = [...this.querySelectorAll<HTMLElement>(".slide")];
    if (!track || slides.length === 0) return;
    this.dataset.enhanced = "true";
    track.tabIndex = 0;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const dots = [...this.querySelectorAll<HTMLButtonElement>(".carousel-dot")];
    const prev = this.querySelector<HTMLButtonElement>(".carousel-prev");
    const next = this.querySelector<HTMLButtonElement>(".carousel-next");
    const controls = [this.querySelector<HTMLElement>(".carousel-dots"), prev, next];
    if (slides.length > 1) for (const control of controls) if (control) control.hidden = false;

    let current = 0;

    const clamp = (index: number) => Math.max(0, Math.min(index, slides.length - 1));

    const goTo = (index: number): void => {
      const slide = slides[clamp(index)];
      if (!slide) return;
      const centred = slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
      track.scrollTo({ left: centred, behavior: reduced.matches ? "auto" : "smooth" });
    };

    const mark = (index: number): void => {
      current = index;
      for (const [position, dot] of dots.entries()) dot.setAttribute("aria-current", String(position === index));
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
    };
    mark(0);

    prev?.addEventListener("click", () => goTo(current - 1));
    next?.addEventListener("click", () => goTo(current + 1));
    for (const [index, dot] of dots.entries()) dot.addEventListener("click", () => goTo(index));

    const arrowStep = (key: string): number => (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0);

    track.addEventListener("keydown", (event) => {
      const step = arrowStep(event.key);
      if (step === 0) return;
      event.preventDefault();
      goTo(current + step);
    });

    // Which slide the reader is looking at: the one covering most of the track.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) mark(slides.indexOf(entry.target as HTMLElement));
      },
      { root: track, threshold: 0.6 }
    );
    for (const slide of slides) observer.observe(slide);

    const lightbox = this.querySelector<HTMLDialogElement>(".lightbox");
    const stage = lightbox?.querySelector("figure");
    if (!lightbox || !stage) return;

    const open = (index: number): void => {
      const figure = slides[clamp(index)]?.querySelector("figure");
      if (!figure) return;
      current = clamp(index);
      const content = [...figure.children].filter((child) => !child.classList.contains("slide-expand"));
      stage.replaceChildren(...content.map((child) => child.cloneNode(true)));
      if (!lightbox.open) lightbox.showModal();
    };

    for (const [index, slide] of slides.entries()) {
      const button = slide.querySelector<HTMLButtonElement>(".slide-expand");
      if (!button) continue;
      button.hidden = false;
      button.addEventListener("click", () => open(index));
    }

    enhanceDialog(lightbox, null);
    lightbox.addEventListener("keydown", (event) => {
      const step = arrowStep(event.key);
      if (step === 0) return;
      event.preventDefault();
      open(current + step);
      goTo(current);
    });
  }
}

customElements.define("screenshot-carousel", ScreenshotCarousel);
