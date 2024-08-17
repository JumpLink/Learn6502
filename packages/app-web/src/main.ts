import { SimulatorWidget } from "./simulator-widget.js"

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll<HTMLElement>('.widget').forEach(function (widget) {
    new SimulatorWidget(widget);
  });
});
