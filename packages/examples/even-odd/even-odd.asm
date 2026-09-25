	;; even? a -- a
	lda #3
	sta $0
loop:	ror
	bcc loop
	cmp #0
	beq even
	jmp odd
even:   lda #1
	jmp end
odd:    lda #0
	jmp end
	
end:	brk
