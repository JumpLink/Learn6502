import { SimulatorWidget } from "@easy6502/6502"

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll<HTMLElement>('.widget').forEach(function (widget) {
    SimulatorWidget(widget);
  });
});
