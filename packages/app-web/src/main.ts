import { GameConsole } from "./game-console.js";

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll<HTMLElement>(".widget").forEach(function (widget) {
    new GameConsole(widget);
  });
});
