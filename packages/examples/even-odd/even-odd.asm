; Even or Odd
;
; A number is even when its lowest bit (bit 0) is 0, and odd when it is 1.
; That single bit is all parity is, so nothing has to be stored or copied:
; LSR shifts bit 0 into the carry flag and BCC branches on that one bit.
;
; Result in A: 1 = even, 0 = odd.

  lda #6       ; the number to test - change it to try another value
  lsr          ; shift right: bit 0 moves into the carry flag
  bcc even     ; carry clear means bit 0 was 0, so the number is even
  lda #0       ; carry set means bit 0 was 1, so the number is odd
  brk

even:
  lda #1       ; even
  brk
