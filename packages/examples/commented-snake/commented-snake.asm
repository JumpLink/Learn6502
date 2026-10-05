;  ___           _        __ ___  __ ___
; / __|_ _  __ _| |_____ / /| __|/  \_  )
; \__ \ ' \/ _` | / / -_) _ \__ \ () / /
; |___/_||_\__,_|_\_\___\___/___/\__/___|

; An annotated version of the snake example from Nick Morgan's 6502 assembly tutorial
; on http://skilldrick.github.io/easy6502/ that I created as an exercise for myself
; to learn a little bit about assembly. I **think** I understood everything, but I may
; also be completely wrong :-)

; Change direction with keys: W A S D

; $00-01 => screen location of apple, stored as two bytes, where the first
;           byte is the least significant.
; $10-11 => screen location of snake head stored as two bytes
; $12-?? => snake body (in byte pairs)
; $02    => direction ; 1 => up    (bin 0001)
                      ; 2 => right (bin 0010)
                      ; 4 => down  (bin 0100)
                      ; 8 => left  (bin 1000)
; $03    => snake length, in number of bytes, not segments


;The screens is divided in 8 strips of 8x32 "pixels". Each strip
;is stored in a page, having their own most significant byte. Each
;page has 256 bytes, starting at $00 and ending at $ff.

;   ------------------------------------------------------------
;1  | $0200 - $02ff                                            |
;2  |                                                          |
;3  |                                                          |
;4  |                                                          |
;5  |                                                          |
;6  |                                                          |
;7  |                                                          |
;8  |                                                          |
;   ------------------------------------------------------------
;9  | $03 - $03ff                                              |
;10 |                                                          |
;11 |                                                          |
;12 |                                                          |
;13 |                                                          |
;14 |                                                          |
;15 |                                                          |
;16 |                                                          |
;   ------------------------------------------------------------
;17 | $04 - $03ff                                              |
;18 |                                                          |
;19 |                                                          |
;20 |                                                          |
;21 |                                                          |
;22 |                                                          |
;23 |                                                          |
;24 |                                                          |
;   ------------------------------------------------------------
;25 | $05 - $03ff                                              |
;26 |                                                          |
;27 |                                                          |
;28 |                                                          |
;29 |                                                          |
;30 |                                                          |
;31 |                                                          |
;32 |                                                          |
;   ------------------------------------------------------------

  jsr init ;jump to subroutine init
  jsr loop ;jump to subroutine loop

init:
  jsr initSnake             ;jump to subroutine initSnake
  jsr generateApplePosition ;jump to subroutine generateApplePosition
  rts                       ;return


initSnake:
  ;start the snake in a horizontal position in the middle of the game field
  ;having a total length of one head and 4 bytes for the segments, meaning a
  ;total length of 3: the head and two segments.
  ;The head is looking right, and the snaking moving to the right.

  ;initial snake direction (2 => right)
  lda #2   ;start direction, put the dec number 2 in register A
  sta $02  ;store value of register A at address $02

  ;initial snake length of 4
  lda #4   ;start length, put the dec number 4 (the snake is 4 bytes long)
           ;in register A
  sta $03  ;store value of register A at address $03
  
  ;Initial snake head's location's least significant byte to determine
  ;where in a 8x32 strip the head will start. hex $11 is just right
  ;of the center of the first row of a strip
  lda #$11 ;put the hex number $11 (dec 17) in register A
  sta $10  ;store value of register A at address hex 10

  ;Initial snake body, two least significant bytes set to hex $10
  ;and hex $0f, one and two places left of the head respectively
  lda #$10 ;put the hex number $10 (dec 16) in register A
  sta $12  ;store value of register A at address hex $12
  lda #$0f ;put the hex number $0f (dec 15) in register A
  sta $14  ;store value of register A at address hex $14

  ;the most significant bytes of the head and body of the snake
  ;are all set to hex $04, which is the third 8x32 strip.
  lda #$04 ;put the hex number $04 in register A
  sta $11  ;store value of register A at address hex 11
  sta $13  ;store value of register A at address hex 13
  sta $15  ;store value of register A at address hex 15
  rts      ;return


generateApplePosition:
  ;Th least significant byte of the apple position will determine where
  ;in a 8x32 strip the apple is placed. This number can be any one byte value because
  ;the size of one 8x32 strip fits exactly in one out of 256 bytes
  lda $fe ;load a random number between 0 and 255 from address $fe into register A
  sta $00 ;store value of register A at address hex 00

  ;load a new random number from 2 to 5 into $01 for the most significant byte of
  ;the apple position. This will determine in which 8x32 strip the apple is placed
  lda $fe  ;load a random number from address $fe into register A

  ;AND: logical AND with accumulator. Apply logical AND with hex $03 to value in
  ;register A. Hex 03 is binary 00000011, so only the two least significant bits
  ;are kept, resulting in a value between 0 (bin 00000000) and 3 (bin 00000011).
  ;Add 2 to the result, giving a random value between 2 and 5
  and #$03 ;mask out lowest 2 bits
  clc      ;clear carry flag 
  adc #2   ;add to register A, using carry bit for overflow.
  sta $01  ;store value of y coordinate from register A into address $01

  rts      ;return


loop:
  ;the main game loop
  jsr readKeys         ;jump to subroutine readKeys
  jsr checkCollision   ;jump to subroutine checkCollision
  jsr updateSnake      ;jump to subroutine updateSnake
  jsr drawApple        ;jump to subroutine drawApple
  jsr drawSnake        ;jump to subroutine drawSnake
  jsr spinWheels       ;jump to subroutine spinWheels
  jmp loop             ;jump to loop (this is what makes it loop)


readKeys:
  ;for getting keypresses, the last address ($ff) in the zero page contains
  ;the hex code of the last pressed key

  lda $ff        ;load the value of the latest keypress from address $ff into register A
  cmp #$77       ;compare value in register A to hex $77 (W)
  beq upKey      ;Branch On Equal, to upKey
  cmp #$64       ;compare value in register A to hex $64 (D)
  beq rightKey   ;Branch On Equal, to rightKey
  cmp #$73       ;compare value in register A to hex $73 (S)
  beq downKey    ;Branch On Equal, to downKey
  cmp #$61       ;compare value in register A to hex $61 (A)
  beq leftKey    ;Branch On Equal, to leftKey
  rts            ;return

upKey:
  lda #4          ;load value 4 into register A, correspoding to the value for DOWN
  bit $02         ;AND with value at address $02 (the current direction), 
                  ;setting the zero flag if the result of ANDing the two values
                  ;is 0. So comparing to 4 (bin 0100) only sets zero flag if
                  ;current direction is 4 (DOWN). So for an illegal move (current
                  ;direction is DOWN), the result of an AND would be a non zero value
                  ;so the zero flag would not be set. For a legal move the bit in the
                  ;new direction should not be the same as the one set for DOWN,
                  ;so the zero flag needs to be set
  bne illegalMove ;Branch If Not Equal: meaning the zero flag is not set.

  lda #1          ;Ending up here means the move is legal, load the value 1 (UP) into
                  ;register A
  sta $02         ;Store the value of A (the new direction) into register A
  rts             ;return

rightKey:
  lda #8          ;load value 8 into register A, corresponding to the value for LEFT
  bit $02         ;AND with current direction at address $02 and check if result
                  ;is zero
  bne illegalMove ;Branch If Not Equal: meaning the zero flag is not set.

  lda #2          ;Ending up here means the move is legal, load the value 2 (RIGHT) into
                  ;register A
  sta $02         ;Store the value of A (the new direction) into register A
  rts             ;return

downKey:
  lda #1          ;load value 1 into register A, correspoding to the value for UP
  bit $02         ;AND with current direction at address $02 and check if result
                  ;is zero
  bne illegalMove ;Branch If Not Equal: meaning the zero flag is not set.

  lda #4          ;Ending up here means the move is legal, load the value 4 (DOWN) into
                  ;register A
  sta $02         ;Store the value of A (the new direction) into register A
  rts             ;return

leftKey:
  lda #2          ;load value 1 into register A, correspoding to the value for RIGHT
  bit $02         ;AND with current direction at address $02 and check if result
                  ;is zero
  bne illegalMove ;Branch If Not Equal: meaning the zero flag is not set.

  lda #8          ;Ending up here means the move is legal, load the value 8 (LEFT) into
                  ;register A
  sta $02         ;Store the value of A (the new direction) into register A
  rts             ;return

illegalMove:
  ;for an illegal move, just return, so the keypress is ignored
  rts             ;return


checkCollision:
  jsr checkAppleCollision ;jump to subroutine checkAppleCollision
  jsr checkSnakeCollision ;jump to subroutine checkSnakeCollision
  rts                     ;return


checkAppleCollision:
  ;check if the snake collided with the apple by comparing the least significant
  ;and most significant byte of the position of the snake's head and the apple.
  lda $00                 ;load value at address $00 (the least significant
                          ;byte of the apple's position) into register A
  cmp $10                 ;compare to the value stored at address $10
                          ;(the least significant byte of the position of the snake's head)
  bne doneCheckingAppleCollision ;if different, branch to doneCheckingAppleCollision
  lda $01                 ;load value of address $01 (the most significant byte
                          ;of the apple's position) into register A
  cmp $11                 ;compare the value stored at address $11 (the most
                          ;significant byte of the position of the snake's head)
  bne doneCheckingAppleCollision ;if different, branch to doneCheckingAppleCollision

  ;Ending up here means the coordinates of the snake head are equal to that of
  ;the apple: eat apple
  inc $03                 ;increment the value held in memory $03 (snake length)
  inc $03                 ;twice because we're adding two bytes for one segment

  ;create a new apple
  jsr generateApplePosition ;jump to subroutine generateApplePosition

doneCheckingAppleCollision:
  ;the snake head was not on the apple. Don't do anything with the apple
  rts ;return


checkSnakeCollision:
  ldx #2 ;Load the value 2 into the X register, so we start with the first segment

snakeCollisionLoop:
  lda $10,x ;load the value stored at address $10 (the least significant byte of
            ;the location of the snake's head) plus the value of the x register
            ;(2 in the first iteration) to get the least significant byte of the
            ;position of the next snake segment
  cmp $10   ;compare to the value at address $10 (the least significant
            ;byte of the position of the snake's head
  bne continueCollisionLoop ;if not equals, we haven't found a collision yet,
                            ;branch to continueCollisionLoop to continue the loop

maybeCollided:
  ;ending up here means we found a segment of the snake's body that
  ;has a least significant byte that's equal to that of the snake's head.
  lda $11,x      ;load the value stored at address $11 (most significant byte of
                 ;the location of the snake's head) plus the value of the x register
                 ;(2 in the first iteration) to get the most significant byte
                 ;of the position of the next snake segment
  cmp $11        ;compare to the value at address $11 (the most significant
                 ;byte of the position of the snake head)
  beq didCollide ;both position bytes of the compared segment of the snake body
                 ;are equal to those of the head, so we have a collision of the
                 ;snake's head with its own body.

continueCollisionLoop:
  ;increment the value in the x register twice because we use two bytes to store
  ;the coordinates for snake head and body segments
  inx              ;increment the value of the x register
  inx              ;increment the value of the x register
  cpx $03          ;compare the value in the x register to the value stored at
                   ;address $03 (snake length).
  beq didntCollide ;if equals, we got to last section with no collision: branch
                   ;to didntCollide
  
  ;ending up here means we haven't checked all snake body segments yet
  jmp snakeCollisionLoop;jump to snakeCollisionLoop to continue the loop

didCollide:
  ;there was a collision
  jmp gameOver ;jump to gameOver

didntCollide:
  ;there was no collision, continue the game
  rts ;return


updateSnake:
  ;collision checks have been done, update the snake. Load the length of the snake
  ;minus one into the A register
  ldx $03 ;load the value stored at address $03 (snake length) into register X
  dex     ;decrement the value in the X register
  txa     ;transfer the value stored in the X register into the A register. WHY?

updateloop:

  ;Example: the length of the snake is 4 bytes (two segments). In the lines above
  ;the X register has been set to 3. The snake coordinates are now stored as follows:
  ;$10,$11 : the snake head
  ;$12,$13,$14,$15: the snake body segments (two bytes for each of the 2 segments)
  ;
  ;The loop shifts all coordinates of the snake two places further in memory,
  ;calculating the offset of the origin from $10 and place it in memory offset to
  ;$12, effectively shifting each of the snake's segments one place further:
  ;
  ;from:  x===
  ;to:    ===
  lda $10,x ;load the value stored at address $10 + x into register A
  sta $12,x ;store the value of register A into address $12 
            ;plus the value of register X
  dex       ;decrement X, and set negative flag if value becomes negative
  bpl updateloop ;branch to updateLoop if positive (negative flag not set)

  ;now determine where to move the head, based on the direction of the snake
  ;lsr: Logical Shift Right. Shift all bits in register A one bit to the right
  ;the bit that "falls off" is stored in the carry flag
  lda $02   ;load the value from address $02 (direction) into register A
  lsr       ;shift to right
  bcs up    ;if a 1 "fell off", we started with bin 0001, so the snakes needs to go up
  lsr       ;shift to right
  bcs right ;if a 1 "fell off", we started with bin 0010, so the snakes needs to go right
  lsr       ;shift to right
  bcs down  ;if a 1 "fell off", we started with bin 0100, so the snakes needs to go down
  lsr       ;shift to right
  bcs left  ;if a 1 "fell off", we started with bin 1000, so the snakes needs to go left
up:
  lda $10   ;put value stored at address $10 (the least significant byte, meaning the
            ;position in a 8x32 strip) in register A
  sec       ;set carry flag
  sbc #$20  ;Subtract with Carry: subtract hex $20 (dec 32) together with the NOT of the
            ;carry bit from value in register A. If overflow occurs the carry bit is clear.
            ;This moves the snake up one row in its strip and checks for overflow
  sta $10   ;store value of register A at address $10 (the least significant byte
            ;of the head's position)
  bcc upup  ;If the carry flag is clear, we had an overflow because of the subtraction,
            ;so we need to move to the strip above the current one
  rts       ;return
upup:
  ;An overflow occurred when subtracting 20 from the least significant byte
  dec $11   ;decrement the most significant byte of the snake's head's position to
            ;move the snake's head to the next up 8x32 strip
  lda #$1   ;load hex value $1 (dec 1) into register A
  cmp $11   ;compare the value at address $11 (snake head's most significant
            ;byte, determining which strip it's in). If it's 1, we're one strip too
            ;(the first one has a most significant byte of $02), which means the snake
            ;hit the top of the screen

  beq collision ;branch if equal to collision
  rts       ;return
right:
  inc $10   ;increment the value at address $10 (snake head's least
            ;significant byte, determining where in the 8x32 strip the head is
            ;located) to move the head to the right
  lda #$1f  ;load value hex $1f (dec 31) into register A
  bit $10   ;the value stored at address $10 (the snake head coordinate) is ANDed
            ;with hex $1f (bin 11111), meaning all multiples of hex $20 (dec 32)
            ;will be zero (because they all end with bit patterns ending in 5 zeros)
            ;if it's zero, it means we hit the right of the screen
  beq collision ;branch to collision if zero flag is set
  rts       ;return
down: 
  lda $10   ;put value from address $10 (the least significant byte, meaning the
            ;position in a 8x32 strip) in register A
  clc       ;clear carry flag
  adc #$20  ;add hex $20 (dec 32) to the value in register A and set the carry flag
            ;if overflow occurs
  sta $10   ;store the result at address $10 
  bcs downdown ;if the carry flag is set, an overflow occurred when adding hex $20 to the
            ;least significant byte of the location of the snake's head, so we need to move
            ;the next 8x3 strip
  rts       ;return
downdown:
  inc $11   ;increment the value in location hex $11, holding the most significatnt byte
            ;of the location of the snake's head.
  lda #$6   ;load the value hex $6 into the A register
  cmp $11   ;if the most significant byte of the head's location is equals to 6, we're
            ;one strip to far down (the last one was hex $05)
  beq collision ;if equals to 6, the snake collided with the bottom of the screen
  rts       ;return

left:
  ;A collision with the left side of the screen happens if the head wraps around to
  ;the previous row, on the right most side of the screen, where, because the screen
  ;is 32 wide, the right most positions always have a least significant byte that ends
  ;in 11111 in binary form (hex $1f). ANDing with hex $1f in this column will always
  ;return hex $1f, so comparing the result of the AND with hex $1f will determine if
  ;the snake collided with the left side of the screen.

  dec $10   ;subtract one from the value held in memory position $10 (least significant
            ;byte of the snake head position) to make it move left.
  lda $10   ;load value held in memory position $10 (least significant byte of the
            ;snake head position) into register A
  and #$1f  ;AND the value hex $1f (bin 11111) with the value in register A
  cmp #$1f  ;compare the ANDed value above with bin 11111.
  beq collision ;branch to collision if equals
  rts       ;return
collision:
  jmp gameOver ;jump to gameOver


drawApple:
  ldy #0       ;load the value 0 into the Y register
  lda $fe      ;load the value stored at address $fe (the random number generator)
               ;into register A
  sta ($00),y  ;dereference to the address stored at address $00 and $01
               ;(the address of the apple on the screen) and set the value to
               ;the value of register A and add the value of Y (0) to it. This results
               ;in the apple getting a random color
  rts          ;return


drawSnake:
  ldx #0      ;set the value of the X register to 0
  lda #1      ;set the value of the A register to 1
  sta ($10,x) ;dereference to the memory address that's stored at address
              ;$10 (the two bytes for the location of the head of the snake) and
              ;set its value to the one stored in register A
  ldx $03     ;set the value of the x register to the value stored in memory at
              ;location $03 (the length of the snake)
  lda #0      ;set the value of the a register to 0
  sta ($10,x) ;dereference to the memory address that's stored at address
              ;$10, add the length of the snake to it, and store the value of
              ;register A (0) in the resulting address. This draws a black pixel on the
              ;tail. Because the snake is moving, the head "draws" on the screen in
              ;white as it moves, and the tail works as an eraser, erasing the white trail
              ;using black pixels
  rts         ;return


spinWheels:
  ;slow the game down by wasting cycles
  ldx #0       ;load zero in the X register
spinloop:
  nop          ;no operation, just skip a cycle
  nop          ;no operation, just skip a cycle
  dex          ;subtract one from the value stored in register x
  bne spinloop ;if the zero flag is clear, loop. The first dex above wrapped the
               ;value of x to hex $ff, so the next zero value is 255 (hex $ff)
               ;loops later.
  rts          ;return


gameOver: ;game over is literally the end of the program