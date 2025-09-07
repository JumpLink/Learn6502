# Common UI - Four-Layer Architecture

## Overview

The `common-ui` package implements a **four-layer architecture** for maximum code reuse and maintainability. This architecture strictly separates business logic, coordination, UI contracts, and platform-specific implementations.

## Architecture Layers

### 1. Service Layer (`*-service.ts`)

**Purpose:** Platform-independent business logic and state management

- ✅ Pure functions, no UI dependencies
- ✅ Singleton export: `export const service = new Service()`
- ✅ All calculations, transformations, and validations
- ✅ Comprehensive error handling

**Example:**

```typescript
export class ButtonStateService {
  calculateButtonState(state: SimulatorState): MainButtonState {
    // Pure business logic
  }
}
export const buttonStateService = new ButtonStateService();
```

### 2. Controller Layer (`*-controller.ts`)

**Purpose:** Coordination between services and UI widgets

- ✅ **NEVER implements View interfaces** (critical anti-pattern!)
- ✅ Delegates all business logic to services
- ✅ Event dispatching and routing
- ✅ Singleton export: `export const controller = new Controller()`

**Example:**

```typescript
export class DebuggerController {
  update(memory: Memory, simulator: Simulator) {
    // Delegate to service
    debuggerStateService.updateFromSimulatorState(simulator.state);
    // Update UI
    this.events.dispatch("stateChanged", newState);
  }
}
```

### 3. Interface Layer (`*.ts`)

**Purpose:** Abstract UI contracts for platform-specific implementations

- ✅ Only UI-specific method signatures
- ✅ No implementations or business logic
- ✅ Clear, minimal contracts

**Example:**

```typescript
export interface DebuggerView {
  update(memory: Memory): void;
  log(message: string): void;
}
```

### 4. Widget Layer (Platform-specific)

**Purpose:** Concrete UI implementations

- ✅ Implements interface contracts
- ✅ Uses controllers for state management
- ✅ Platform-specific UI frameworks (GTK, React, etc.)

## Service Overview

| Service                      | Purpose                      | Platform          |
| ---------------------------- | ---------------------------- | ----------------- |
| `button-state-service`       | Button state calculations    | shared            |
| `debugger-state-service`     | Debugger state management    | shared            |
| `game-console-state-service` | Game console rendering       | shared            |
| `game-console-input-service` | Gamepad/keyboard handling    | shared            |
| `learn-state-service`        | Learning progress management | shared            |
| `file-service`               | File operations              | platform-specific |
| `theme-service`              | Theme management             | platform-specific |
| `notification-service`       | Notifications                | platform-specific |

## Best Practices

### ✅ Services

- Always export singleton instances
- Keep state minimal and focused
- Use pure functions where possible
- Document all public methods

### ✅ Controllers

- **NEVER** implement View interfaces (anti-pattern!)
- Delegate all business logic to services
- Use EventDispatcher for loose coupling
- Keep methods small and focused

### ✅ Interfaces

- Define only UI-specific operations
- Keep contracts minimal but complete
- Use clear, descriptive names

### 🚫 Critical Anti-Patterns

- ❌ `class Controller implements ViewInterface`
- ❌ Business logic in controllers
- ❌ UI dependencies in services
- ❌ Mixed responsibilities

## Migration Guide

### Migrating from old architecture:

1. **Extract business logic** → create new service
2. **Clean up controller** → remove `implements ViewInterface`
3. **Implement delegation** → controller calls service methods
4. **Update interfaces** → keep only UI methods
5. **Test platforms** → ensure all implementations still work

### Migration Example:

```typescript
// ❌ OLD (Anti-Pattern)
class OldController implements ViewInterface {
  update(data: Input) {
    // Business logic mixed with UI
    const result = this.calculateState(data);
    this.updateUI(result);
  }
}

// ✅ NEW (Four-Layer Architecture)
class StateService {
  calculateState(data: Input): Output {
    // Pure business logic
  }
}

class NewController {
  update(data: Input) {
    // Delegate to service
    const result = stateService.calculateState(data);
    // Dispatch to UI
    this.events.dispatch("updated", result);
  }
}
```

## Benefits of this Architecture

- **🔄 Maximum Reuse** - Services run on all platforms
- **🧪 Easy to Test** - Pure services without UI dependencies
- **🛠️ Maintainable** - Clear separation of responsibilities
- **📱 Platform Independent** - Services are framework-agnostic
- **🎯 Focused** - Each layer has a single responsibility
