;==============================================================================
; Stack Example - Mirrored Pattern Generator
;==============================================================================
; This program demonstrates the use of the stack (PHA/PLA instructions) by
; creating a mirrored color pattern on the display.
;
; Display Memory: $0200-$05FF represents the screen pixels
; Color Values:   $00-$0F (16 colors: $00=black, $01=white, etc.)
; Stack Memory:   $0100-$01FF (Stack Pointer starts at $FF)
;
; The program works in two phases:
; 1. First loop:  Draws colors 0-15 while pushing them onto the stack
; 2. Second loop: Pops colors from stack (in reverse) and draws them
; Result: A mirrored pattern showing colors 0-15-0 (32 pixels total)
;==============================================================================

; Initialize registers
LDX #$00        ; X = $00 (will hold the pixel color, starting at black)
LDY #$00        ; Y = $00 (will hold the pixel position on screen)

; First loop: Draw colors in ascending order AND push them to stack
firstloop:
  TXA           ; Transfer X to A (copy color value to accumulator)
                ; We need the color in A because STA only works with A
  
  STA $0200,Y   ; Store color at screen position $0200 + Y
                ; First iteration: stores $00 at $0200 (top-left pixel)
                ; Second iteration: stores $01 at $0201 (second pixel)
                ; This uses "Absolute,Y" addressing mode
  
  PHA           ; Push Accumulator to stack
                ; This saves the current color for later use
                ; Stack Pointer decrements: $FF -> $FE -> $FD etc.
                ; Colors are stored at: $01FF, $01FE, $01FD...
  
  INX           ; Increment X (next color: $00 -> $01 -> $02 etc.)
                ; X cycles through all 16 colors ($00 to $0F)
  
  INY           ; Increment Y (next pixel position)
                ; Y tracks where we are on the screen
  
  CPY #$10      ; Compare Y with $10 (decimal 16)
                ; This sets the Zero flag if Y equals $10
  
  BNE firstloop ; Branch if Not Equal (if Z flag = 0)
                ; Continue looping until Y reaches $10
                ; After 16 iterations: 16 colors drawn, 16 values on stack

; At this point:
; - Screen positions $0200-$020F contain colors $00-$0F
; - Stack contains colors $0F down to $00 (LIFO = Last In, First Out)
; - Y = $10 (pixel position 16)
; - Stack Pointer = $EF (16 values pushed)

; Second loop: Pop colors from stack and draw in reverse order
secondloop:
  PLA           ; Pull (pop) Accumulator from stack
                ; First iteration pulls $0F, then $0E, then $0D, etc.
                ; Stack Pointer increments: $EF -> $F0 -> $F1 etc.
                ; This retrieves colors in REVERSE order (LIFO principle)
  
  STA $0200,Y   ; Store the popped color at screen position $0200 + Y
                ; First iteration: stores $0F at $0210 (17th pixel)
                ; Second iteration: stores $0E at $0211 (18th pixel)
                ; Creates a mirror effect: ...0D 0E 0F 0F 0E 0D...
  
  INY           ; Increment Y (next pixel position)
                ; Y continues from $10: $11, $12, $13...
  
  CPY #$20      ; Compare Y with $20 (decimal 32)
                ; Check if we've drawn 32 pixels total
  
  BNE secondloop ; Branch if Not Equal
                ; Loop until Y reaches $20 (32 pixels total)

; Final result:
; - Screen positions $0200-$021F contain: 0,1,2...E,F,F,E...2,1,0
; - A symmetric/mirrored color pattern is displayed
; - The stack is now empty again (all values popped)
; - Stack Pointer back to $FF

;==============================================================================
; Key Concepts Demonstrated:
;
; 1. STACK OPERATIONS (LIFO principle):
;    - PHA pushes A to stack, SP decrements
;    - PLA pulls from stack to A, SP increments
;    - Stack lives at $0100-$01FF
;
; 2. ADDRESSING MODES:
;    - Immediate (#$00): literal values
;    - Absolute,Y ($0200,Y): base address + Y register
;
; 3. REGISTERS:
;    - A (Accumulator): main working register for data
;    - X: used as color counter
;    - Y: used as position counter/index
;
; 4. BRANCHING:
;    - CPY sets Zero flag when Y equals the compared value
;    - BNE branches when Zero flag is clear (values not equal)
;
; 5. PRACTICAL USE:
;    - Stacks are essential for: saving state, reversing order,
;      subroutine calls (JSR/RTS), interrupt handling
;==============================================================================