# Learn6502 Common UI

This package contains shared interfaces, components and utilities for the Learn6502 application across different platforms (GNOME, Web, and Android).

## Overview

The purpose of this package is to provide a consistent API and reusable code across different platform implementations, making it easier to maintain and extend the application.

## Components

### Views

- **MainView**: Common interface for the main application window/view
- **EditorView**: Interface for code editor component
- **GameConsoleView**: Interface for the 6502 game console/emulator view

### Widgets

- **MainButton**: Interface and utilities for the main floating action button
- **DisplayWidget**: Interface for the display canvas/component
- **MessageConsole**: Interface for the console output
- **SourceView**: Interface for displaying source code
- **DebuggerWidget**: Interface for the debugger component

### Utilities

- **UIController**: Base class for managing UI state across platforms
- **GamepadController**: Controller for handling gamepad/keyboard input
- **FileManager**: Interface for file operations (open, save, etc.)
- **MainButtonHelper**: Utility for managing main button states

## Usage

Import the needed components from the package:

```typescript
import { MainView, EditorView, UIController } from "@learn6502/common-ui";
```

Implement the interfaces in your platform-specific code:

```typescript
export class MyPlatformMainView implements MainView {
  // Implement the interface methods
  assembleGameConsole(): void {
    // Platform-specific implementation
  }

  // ...other methods
}
```

## Data Flow

The common communication pattern between components is:

1. User interacts with UI (clicks button, types code)
2. Platform-specific component handles the raw event
3. Common interface methods are called (e.g., `assembleGameConsole()`)
4. Platform-specific implementation processes the action
5. Common events/signals are emitted for other components to react

## Development

When adding features to the Easy6502 application, consider whether the functionality should be:

1. In the platform-specific implementation
2. In this common-ui package
3. In the core 6502 emulator package

Generally, UI-related logic that can be shared across platforms should go in this package.

## Component Architecture Pattern

Each view or widget in the common-ui package follows a consistent pattern:

1. **Interface file** - Defines the component API (e.g., `debugger.ts`, `main-button.ts`)
2. **Controller implementation** - Contains the shared logic (e.g., `debugger-controller.ts`, `main-ui-state-controller.ts`)
3. **Event map file** - Declares event types if the component uses events (e.g., `debugger-event-map.ts`, `main-ui-state-event-map.ts`)

This separation allows platform-specific implementations to consistently implement the interfaces while reusing the controller logic.

### Widget Creation Example

```typescript
// my-widget.ts (Interface)
export interface MyWidget {
  update(data: SomeData): void;
  getState(): WidgetState;
}

// my-widget-event-map.ts (Event map)
export interface MyWidgetEventMap {
  "state-changed": WidgetState;
  "data-updated": SomeData;
}

// my-widget-controller.ts (Controller)
import { EventDispatcher } from "@learn6502/6502";
import type { MyWidgetEventMap } from "../types/index.ts";
import type { MyWidget } from "../widgets/index.ts";

class MyWidgetController implements MyWidget {
  protected events = new EventDispatcher<MyWidgetEventMap>();
  private state: WidgetState = WidgetState.INITIAL;

  public update(data: SomeData): void {
    // Implementation
    this.events.dispatch("data-updated", data);
  }

  public getState(): WidgetState {
    return this.state;
  }
}

export const myWidgetController = new MyWidgetController();
```
