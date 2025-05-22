# Type System for the 6502 Simulator

This directory contains type definitions for the 6502 simulator.

## Event System

The 6502 simulator uses a type-safe event system based on the `EventDispatcher` class. Events are defined using interfaces that map event names to their payload types.

### Simulator Events

Previously, all simulator events used the generic `SimulatorEvent` interface. The codebase has been migrated to use specific event types for each kind of event:

- `SimulatorStartEvent`: Emitted when the simulator starts execution
- `SimulatorStepEvent`: Emitted when the simulator executes a single instruction
- `SimulatorMultiStepEvent`: Emitted when the simulator executes multiple instructions at once
- `SimulatorResetEvent`: Emitted when the simulator is reset
- `SimulatorStopEvent`: Emitted when the simulator stops execution
- `SimulatorGotoEvent`: Emitted when the simulator jumps to a specific address
- `SimulatorFailureEvent`: Emitted when the simulator encounters a failure
- `SimulatorInfoEvent`: Emitted for general simulator information
- `SimulatorPseudoOpEvent`: Emitted when a pseudo-operation is executed

All these event types extend the `SimulatorBaseEvent` interface which contains common properties shared across all simulator events.

The `SimulatorEventsMap` interface maps event names to their corresponding event types, enabling type-safe event handling.

### Memory Events

The Memory class now uses a type-safe event system as well:

- `MemoryChangedEvent`: Emitted when a memory location is changed, includes the address and new value

The `MemoryEventsMap` interface maps the "changed" event name to the `MemoryChangedEvent` type.

### Labels Events

The Labels class has been updated to use type-safe events:

- `LabelsInfoEvent`: Emitted for informational messages from the Labels class
- `LabelsFailureEvent`: Emitted when the Labels class encounters a failure

Both event types extend the `LabelsBaseEvent` interface which contains common properties. The `LabelsEventsMap` interface maps event names to their corresponding types.

### Assembler Events

The Assembler class has been updated to use type-safe events:

- `AssemblerSuccessEvent`: Emitted when assembly is successful
- `AssemblerFailureEvent`: Emitted when assembly fails
- `AssemblerHexdumpEvent`: Emitted for hexdump output
- `AssemblerInfoEvent`: Emitted for informational messages from the Assembler
- `AssemblerDisassemblyEvent`: Emitted when disassembly is generated, includes the disassembled data

All these event types extend the `AssemblerBaseEvent` interface. The `AssemblerEventsMap` interface maps event names to their corresponding types.

## Usage Examples

### Subscribing to simulator events

```typescript
// Type-safe event handling
simulator.on("step", (event) => {
  // event is properly typed as SimulatorStepEvent
  console.log(`Step executed, simulator state: ${event.state}`);
});

// Will cause a TypeScript error since this event doesn't exist
simulator.on("non-existent-event", () => {}); // Error!
```

### Subscribing to memory events

```typescript
// Type-safe event handling for memory
memory.on("changed", (event) => {
  // event is properly typed as MemoryChangedEvent
  console.log(`Memory changed at 0x${event.addr.toString(16)}: ${event.val}`);
});
```

### Subscribing to labels events

```typescript
// Type-safe event handling for labels
labels.on("labels-info", (event) => {
  // event is properly typed as LabelsInfoEvent
  console.log(`Labels info: ${event.message}`);
});

labels.on("labels-failure", (event) => {
  // event is properly typed as LabelsFailureEvent
  console.log(`Labels error: ${event.message}`);
});
```

### Subscribing to assembler events

```typescript
// Type-safe event handling for assembler
assembler.on("assemble-success", (event) => {
  // event is properly typed as AssemblerSuccessEvent
  console.log(`Assembly successful: ${event.message}`);
});

assembler.on("disassembly", (event) => {
  // event is properly typed as AssemblerDisassemblyEvent
  console.log(`Disassembly data:`, event.data);
});
```

### Using the EventDispatcher directly

```typescript
// Create a type-safe event dispatcher
const events = new EventDispatcher<{
  customEvent: { data: string };
  anotherEvent: number;
}>();

// Type-safe event dispatching and handling
events.on("customEvent", (event) => {
  console.log(event.data); // TypeScript knows this property exists
});

events.dispatch("customEvent", { data: "Hello, world!" });
```
