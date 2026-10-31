// Real GObject backs the GTK subset on Android (gjsify ADR 0110), and the app has to say so: the
// port refuses to load with an empty engine slot. This module is app.ts's FIRST import because the
// slot freezes on its first read, which happens at the port's module load.
import requireGi from "@gjsify/node-gi/gi";
import { useRealGObjectEngine } from "@gjsify/adwaita-gobject-native";

useRealGObjectEngine(requireGi);
