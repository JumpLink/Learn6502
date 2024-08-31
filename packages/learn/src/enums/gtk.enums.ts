// Enums copied from @girs/gtk-4.0

export enum Orientation {
    /**
     * The element is in horizontal orientation.
     */
    HORIZONTAL,
    /**
     * The element is in vertical orientation.
     */
    VERTICAL,
}

export enum Align {
    /**
     * stretch to fill all space if possible, center if
     *   no meaningful way to stretch
     */
    FILL,
    /**
     * snap to left or top side, leaving space on right or bottom
     */
    START,
    /**
     * snap to right or bottom side, leaving space on left or top
     */
    END,
    /**
     * center natural width of widget inside the allocation
     */
    CENTER,
    /**
     * a different name for `GTK_ALIGN_BASELINE`.
     */
    BASELINE_FILL,
    /**
     * align the widget according to the baseline.
     */
    BASELINE,
    /**
     * stretch to fill all space, but align the baseline.
     */
    BASELINE_CENTER,
}

// Custom enums

export enum TextListType {
    ORDERED,
    UNORDERED,
}