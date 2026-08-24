;      _ _
;   __| (_)_ _  ___
;  / _` | | ' \/ _ \
;  \__,_|_|_||_\___/
;
; A tiny "Browser offline dinosaur run" style endless runner for the
; 6502 emulator: http://skilldrick.github.io/easy6502/
;
; Controls: W or SPACE = jump
;
; --- Memory map ---
; $01 => jumping flag: 0 = on the ground, 1 = currently jumping
; $02 => jumpStep: how many frames into the current jump (0-7)
; $03 => obstacleCol: the cactus's LEFT column (0-29), only
;        meaningful while $04 is 1. The cactus is 3 columns wide.
; $04 => obstacleActive: 1 if a cactus is currently on screen,
;        0 if we're in the gap waiting to spawn the next one
; $06 => scratch: 1 if the dino is still low enough to hit a
;        cactus (standing, or only 1-3 rows up), 0 only at the very
;        peak of the jump (level 4), once he's fully cleared it
; $07 => scratch: screen offset of the cactus's TOP-CENTER cell
;        within page $05 (see the cactus shape notes below)
; $08 => spawnDelay: frames left to wait before the next cactus
; $09 => spinDelay: how many spin cycles to wait each frame -- this
;        is what makes the game speed up over time
; $10/$11 => a 16-bit pointer (low/high byte). Used once at startup
;        to paint the sky, then reused for the rest of the game as
;        the dino's TOP-LEFT screen address -- a real 16-bit pointer
;        rather than a single-page offset, since at the peak of the
;        jump the dino's head pokes up into a different page ($04)
;        than its feet ($05)
; $0c => cloudCol: the cloud's left column (0-28) in page $04
; $0d => scratch: screen offset of the cloud's top-left cell within
;        page $04
; $fe => hardware random number generator
; $ff => last key pressed
;
; --- Screen layout ---
; Like the snake example this is based on, the 32x32 screen lives
; in $0200-$05ff, split into four 8x32 "strips", one per page
; ($02,$03,$04,$05). Everything the player interacts with fits in
; the bottom strip, page $05 (screen rows 24-31):
;
;   offset = (row - 24) * 32 + column
;
; The ground is 3 rows thick, at rows 29-31. Everything above that,
; rows 24-28, is open sky.
;
; The dino's bounding box is 3 columns wide (5-7) and 2 rows tall,
; but only 5 of its 6 cells are filled in, giving it a sloped back
; with a head sticking out the front (. = empty, # = filled):
;
;    . # #      <- back sloping up to the head
;    # # #      <- body/legs, solid across the bottom
;
; Since every row is 32 bytes, the filled cells are always
; pointer+1, +2, +32, +33 and +34, no matter which row the whole
; box is sitting at. The pointer ($10/$11) holds the full 16-bit
; address of the (empty) top-left corner:
;   standing  (level 0): $0565
;   1 row up  (level 1): $0545
;   2 rows up (level 2): $0525
;   3 rows up (level 3): $0505
;   4 rows up (level 4): $04e5  <- crosses into page $04!
;
; The dino is 3 columns wide and so is the cactus, so as the cactus
; scrolls past, their columns overlap for 5 frames in a row (not
; just 1). That means the jump needs several consecutive frames at
; the peak to actually clear it -- so the arc now rises for 3
; frames, hangs at the peak (level 4) for 6, and falls for 3.
;
; The cactus, with obstacleCol as its left column, looks like this,
; spanning rows 26-28:
;
;    . # .      <- row 26 (top of the arms/stem)
;    # # #      <- row 27 (the arms stick out here)
;    . # .      <- row 28 (base of the stem, level with the ground)
;
; The cactus reaches all the way up to row 26. Level 3 (rows 24-25)
; already clears it with no overlap, but sits right up against it
; with no gap. Level 4 (rows 23-24) pushes one row higher still, so
; there's a full blank row of sky (row 25) between the dino and the
; cactus at the peak of the jump -- one visible pixel of daylight
; above it, not just a graze. Levels 0-3 all still count as "low
; enough to be hit" for collision purposes; only level 4 is safe.
;
; A small cloud drifts in the sky, well out of the way of any of
; this -- it lives in page $04 (rows 16-23), a completely different
; strip from the ground-level action in page $05. It's 4 columns
; wide and 2 rows tall, with rounded top corners:
;
;    . # # .
;    # # # #
;
; The cloud doesn't move every frame like the dino and cactus do.
; Instead, updateObstacle nudges it one pixel to the left each time
; a cactus finishes crossing the screen, so its slow drift is tied
; to the obstacle count rather than to time.

  jsr init ;jump to subroutine init
  jsr loop ;jump to subroutine loop

init:
  jsr fillBackground ;paint the whole screen light blue
  jsr initGame       ;set up the starting variables
  jsr drawGroundLine ;paint the ground once
  jsr drawDino       ;paint the dino in his starting spot
  jsr initCloud      ;set the cloud's starting position
  jsr drawCloud      ;paint the cloud
  rts                ;return


;Fills all of screen memory ($0200-$05ff, i.e. pages $02-$05) with
;light blue, using an indirect pointer at $10/$11 since that's more
;than one page of memory.
fillBackground:
  ldx #2          ;first page of screen memory ($0200)
fillPageLoop:
  stx $11         ;pointer high byte = current page
  lda #0
  sta $10         ;pointer low byte = 0
  lda #$0e        ;$0e = light blue
  ldy #0
fillByteLoop:
  sta ($10),y     ;paint one cell
  iny
  bne fillByteLoop ;loop all 256 bytes of this page
  inx
  cpx #6          ;stop after pages 2,3,4,5 ($0200-$05ff)
  bne fillPageLoop
  rts


initGame:
  lda #0
  sta $01  ;jumping = 0
  sta $02  ;jumpStep = 0
  sta $04  ;obstacleActive = 0, start in a gap so the player gets a breather
  lda #40
  sta $08  ;spawnDelay = 40 frames before the first cactus shows up
  lda #150
  sta $09  ;spinDelay = 150, i.e. start out at a gentle pace
  rts      ;return


initCloud:
  lda #20
  sta $0c  ;cloudCol = 20, somewhere in the middle of the sky
  rts      ;return


drawGroundLine:
  ;paint rows 29-31 (offsets $a0-$ff in page $05, 96 bytes) brown,
  ;so the ground is visible even before anything walks across it
  ldx #0  ;byte counter, starting at 0
  lda #9  ;9 = brown
drawGroundLoop:
  sta $05a0,x        ;store brown at offset $a0+x
  inx                ;next byte
  cpx #96            ;done all 96 bytes (3 full rows)?
  bne drawGroundLoop ;if not, keep going
  rts                ;return


loop:
  ;the main game loop
  jsr readKeys       ;check for a jump key press
  jsr eraseDino      ;rub out the dino's old position
  jsr eraseObstacle  ;rub out the cactus's old position, if any
  jsr updateDino     ;advance the jump, if he's mid-jump
  jsr updateObstacle ;move the cactus, or count down to the next spawn
  jsr checkCollision ;did a cactus just reach the dino on the ground?
  jsr drawDino       ;paint the dino at his new position
  jsr drawObstacle   ;paint the cactus at its new position, if any
  jsr spinWheels     ;pace the game -- gets shorter as $09 shrinks
  jmp loop           ;do it all again


readKeys:
  ;W or SPACE starts a jump, but only if the dino isn't already jumping.
  ;Important: $ff (the last key pressed) never clears itself in this
  ;emulator, so once we've acted on a jump key we clear it back to 0
  ;ourselves -- otherwise the very next frame would see the same key
  ;still sitting there and start another jump immediately, over and
  ;over, forever.
  lda $ff       ;load the last key pressed
  cmp #$77      ;compare to 'w'
  beq keyIsJump ;branch if it was w
  cmp #$20      ;compare to space bar
  beq keyIsJump ;branch if it was space
  rts           ;otherwise nothing to do, return
keyIsJump:
  lda #0
  sta $ff             ;consume the keypress so it can't retrigger
  lda $01             ;load the jumping flag
  bne readKeysDone    ;if already jumping, ignore this key press
  lda #1
  sta $01             ;jumping = 1
  lda #0
  sta $02             ;jumpStep = 0, start of the jump arc
readKeysDone:
  rts                 ;return


;Works out where the dino currently is and stores the full 16-bit
;address of his bounding box's TOP-LEFT cell in $10/$11, and in $06
;whether he's still low enough for a tall cactus to hit him (1) or
;has cleared it (0, level 4 only). eraseDino, drawDino and
;checkCollision all call this so they agree on where he is.
computeDinoOffset:
  lda $01
  beq groundLevel  ;not jumping at all, so he's on the ground

  lda $02          ;jumpStep decides how high he is right now
  cmp #0
  beq setLvl1      ;just left the ground, one row up
  cmp #1
  beq setLvl2      ;two rows up
  cmp #2
  beq setLvl3      ;three rows up
  cmp #3
  beq setLvl4      ;four rows up: the peak
  cmp #4
  beq setLvl4      ;hang at the peak for several frames, long enough
  cmp #5
  beq setLvl4      ;to cover the full width of the cactus as it
  cmp #6
  beq setLvl4      ;scrolls past underneath
  cmp #7
  beq setLvl4
  cmp #8
  beq setLvl4
  cmp #9
  beq setLvl3      ;coming back down: three rows up
  cmp #10
  beq setLvl2      ;coming back down: two rows up
  cmp #11
  beq setLvl1      ;coming back down: one row up
  ;jumpStep is 12, which means he's back on the ground this frame

groundLevel:
  lda #$65  ;standing: rows 27-28
  sta $10
  lda #$05
  sta $11
  lda #1    ;still low enough to hit a cactus
  sta $06
  rts
setLvl1:
  lda #$45  ;rows 26-27
  sta $10
  lda #$05
  sta $11
  lda #1    ;still overlaps a cactus that reaches up to row 26
  sta $06
  rts
setLvl2:
  lda #$25  ;rows 25-26
  sta $10
  lda #$05
  sta $11
  lda #1    ;still overlaps row 26, the top of the cactus
  sta $06
  rts
setLvl3:
  lda #$05  ;rows 24-25 -- clears the cactus, but with no gap above it
  sta $10
  lda #$05
  sta $11
  lda #0    ;no vertical overlap left, already safe
  sta $06
  rts
setLvl4:
  lda #$e5  ;rows 23-24, in page $04 -- one pixel higher still
  sta $10
  lda #$04
  sta $11
  lda #0    ;a full blank row of sky above the cactus now
  sta $06
  rts


eraseDino:
  ;paint all 5 filled cells of the dino's silhouette back to sky color
  jsr computeDinoOffset
  ldy #1
  lda #$0e
  sta ($10),y       ;top-middle (back)
  ldy #2
  lda #$0e
  sta ($10),y       ;top-right (head)
  ldy #32
  lda #$0e
  sta ($10),y       ;bottom-left (legs)
  ldy #33
  lda #$0e
  sta ($10),y       ;bottom-middle (legs)
  ldy #34
  lda #$0e
  sta ($10),y       ;bottom-right (legs)
  rts


drawDino:
  ;paint all 5 filled cells of the dino's silhouette in dino-grey
  jsr computeDinoOffset
  ldy #1
  lda #12
  sta ($10),y       ;top-middle (back)
  ldy #2
  lda #12
  sta ($10),y       ;top-right (head)
  ldy #32
  lda #12
  sta ($10),y       ;bottom-left (legs)
  ldy #33
  lda #12
  sta ($10),y       ;bottom-middle (legs)
  ldy #34
  lda #12
  sta ($10),y       ;bottom-right (legs)
  rts


updateDino:
  lda $01
  beq updateDinoDone ;not jumping, nothing to advance
  inc $02             ;jumpStep++
  lda $02
  cmp #13             ;has the whole arc played out?
  bne updateDinoDone
  lda #0              ;yes -> jump is finished, back to standing
  sta $01
  sta $02
updateDinoDone:
  rts


;Works out the cactus's current TOP-CENTER screen offset and stores
;it in $07. Only meaningful while $04 (obstacleActive) is 1. The
;cactus's top cell sits at row 26, one column in from its left edge,
;which is offset $41 (65) within page $05 when obstacleCol is 0.
computeObstacleOffset:
  lda $03
  clc
  adc #65
  sta $07
  rts


eraseObstacle:
  lda $04
  beq eraseObstacleDone ;no cactus on screen right now, nothing to erase
  jsr computeObstacleOffset
  lda #$0e             ;back to sky color everywhere the cactus was
  ldx $07
  sta $0500,x           ;top-center
  lda $07
  clc
  adc #31
  tax
  lda #$0e
  sta $0500,x           ;middle-left (the arms)
  lda $07
  clc
  adc #32
  tax
  lda #$0e
  sta $0500,x           ;middle-center
  lda $07
  clc
  adc #33
  tax
  lda #$0e
  sta $0500,x           ;middle-right (the arms)
  lda $07
  clc
  adc #64
  tax
  lda #$0e
  sta $0500,x           ;bottom-center
eraseObstacleDone:
  rts


drawObstacle:
  lda $04
  beq drawObstacleDone ;in a gap, nothing to draw
  jsr computeObstacleOffset
  lda #5                ;5 = green, for every cell of the cactus
  ldx $07
  sta $0500,x            ;top-center
  lda $07
  clc
  adc #31
  tax
  lda #5
  sta $0500,x            ;middle-left (the arms)
  lda $07
  clc
  adc #32
  tax
  lda #5
  sta $0500,x            ;middle-center
  lda $07
  clc
  adc #33
  tax
  lda #5
  sta $0500,x            ;middle-right (the arms)
  lda $07
  clc
  adc #64
  tax
  lda #5
  sta $0500,x            ;bottom-center
drawObstacleDone:
  rts


updateObstacle:
  lda $04
  beq updateObstacleWaiting
  ;--- a cactus is active, move it one column to the left ---
  dec $03
  lda $03
  bpl updateObstacleRts   ;still fully on screen?
  lda #0
  sta $04                 ;walked off the left edge: deactivate it
  jsr speedUp             ;the game gets a little faster
  jsr randomDelay         ;pick a random gap before the next one
  jsr moveCloudOnePixel   ;one cactus down -- shift the cloud left
  rts
updateObstacleWaiting:
  lda $08
  beq updateObstacleSpawn ;gap is over, spawn the next cactus
  dec $08
  rts
updateObstacleSpawn:
  lda #29
  sta $03                 ;new cactus's left edge (it's 3 wide, so
                          ;29 keeps its right edge on screen at 31)
  lda #1
  sta $04                 ;mark it active
  rts
updateObstacleRts:
  rts


;Picks a random gap of 8-39 frames before the next cactus appears
randomDelay:
  lda $fe
  and #$1f  ;0-31
  clc
  adc #8    ;8-39
  sta $08
  rts


;Shortens the frame delay a little, making the game speed up, but
;never lets it go below 20 (or things get unplayably fast)
speedUp:
  lda $09
  sec
  sbc #8
  cmp #20
  bcs speedUpStore ;still 20 or above? store it as-is
  lda #20          ;otherwise clamp to the minimum speed
speedUpStore:
  sta $09
  rts


checkCollision:
  lda $04
  beq noCollision     ;no cactus on screen right now, definitely safe
  jsr computeDinoOffset ;refresh $06: is the dino low enough to be hit?
  lda $06
  beq noCollision     ;level 4 -- fully cleared it, safe no matter what
  ;still low enough to be hit: a collision happens if the cactus's
  ;left column is close enough to overlap the dino's columns (5-7,
  ;the cactus is 3 wide, so columns 3-7 all count as an overlap)
  lda $03
  cmp #3
  beq collisionHit
  cmp #4
  beq collisionHit
  cmp #5
  beq collisionHit
  cmp #6
  beq collisionHit
  cmp #7
  beq collisionHit
  rts                 ;no column overlap, still safe
collisionHit:
  jmp gameOver        ;caught him -- game over
noCollision:
  rts


spinWheels:
  ;pace the game -- $09 shrinks over time, making this delay shorter
  ldx $09
spinloop:
  nop
  nop
  dex
  bne spinloop
  rts


;Works out the cloud's current TOP-LEFT screen offset within page
;$04 and stores it in $0d. The cloud's top row starts 2 rows down
;within this page (row 18), so the base offset is 2*32 + cloudCol.
computeCloudOffset:
  lda $0c
  clc
  adc #64
  sta $0d
  rts


eraseCloud:
  ;paint all 6 filled cells of the cloud back to sky color
  jsr computeCloudOffset
  lda $0d
  clc
  adc #1
  tax
  lda #$0e
  sta $0400,x       ;top row, second column
  lda $0d
  clc
  adc #2
  tax
  lda #$0e
  sta $0400,x       ;top row, third column
  lda $0d
  clc
  adc #32
  tax
  lda #$0e
  sta $0400,x       ;bottom row, first column
  lda $0d
  clc
  adc #33
  tax
  lda #$0e
  sta $0400,x       ;bottom row, second column
  lda $0d
  clc
  adc #34
  tax
  lda #$0e
  sta $0400,x       ;bottom row, third column
  lda $0d
  clc
  adc #35
  tax
  lda #$0e
  sta $0400,x       ;bottom row, fourth column
  rts


drawCloud:
  ;paint all 6 filled cells of the cloud in light grey
  jsr computeCloudOffset
  lda $0d
  clc
  adc #1
  tax
  lda #15
  sta $0400,x       ;top row, second column
  lda $0d
  clc
  adc #2
  tax
  lda #15
  sta $0400,x       ;top row, third column
  lda $0d
  clc
  adc #32
  tax
  lda #15
  sta $0400,x       ;bottom row, first column
  lda $0d
  clc
  adc #33
  tax
  lda #15
  sta $0400,x       ;bottom row, second column
  lda $0d
  clc
  adc #34
  tax
  lda #15
  sta $0400,x       ;bottom row, third column
  lda $0d
  clc
  adc #35
  tax
  lda #15
  sta $0400,x       ;bottom row, fourth column
  rts


;Shifts the cloud one pixel to the left. Called once per cactus
;that finishes crossing the screen, rather than every frame.
moveCloudOnePixel:
  jsr eraseCloud
  dec $0c
  lda $0c
  bpl moveCloudDone   ;still on screen (0-28)?
  lda #28             ;drifted off the left edge, wrap back to the right
  sta $0c
moveCloudDone:
  jsr drawCloud
  rts


gameOver: ;game over is literally the end of the program
