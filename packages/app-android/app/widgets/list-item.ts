import { booleanConverter, ContentView, Property } from "@nativescript/core";
import {
  createColorStateList,
  getMaterialColor,
  getResource,
} from "../utils/index";
import { systemStates, SystemStates } from "../states";
import { SystemAppearanceChangeEvent } from "~/types";

/**
 * Material Design 3 List Item component for Android
 *
 * Provides a customizable list item following Material Design 3 guidelines.
 * Supports one-line, two-line, and three-line layouts with optional leading and trailing content.
 *
 * ## Material Design 3 Features
 *
 * - **One-line**: Single line of text with optional leading/trailing elements
 * - **Two-line**: Headline + supporting text with optional leading/trailing elements
 * - **Three-line**: Headline + up to two lines of supporting text with optional leading/trailing elements
 * - **Leading content**: Icon, image, avatar, checkbox, radio button
 * - **Trailing content**: Text, icon, switch, checkbox
 * - **State support**: Default, selected, disabled states
 * - **Dividers**: Optional divider support
 * - **Accessibility**: Full screen reader support with content descriptions
 *
 * ## Material Design 3 Color System
 *
 * | UI Element          | Default Material Color Token |
 * |---------------------|------------------------------|
 * | Container background| colorSurface                 |
 * | Headline text       | colorOnSurface               |
 * | Supporting text     | colorOnSurfaceVariant        |
 * | Leading icon        | colorOnSurfaceVariant        |
 * | Trailing text       | colorOnSurfaceVariant        |
 * | Selected container  | colorSecondaryContainer      |
 * | Selected text       | colorOnSecondaryContainer    |
 *
 * ## References
 * - [Lists Overview](https://m3.material.io/components/lists/overview)
 * - [Lists Specs](https://m3.material.io/components/lists/specs)
 * - [Lists Guidelines](https://m3.material.io/components/lists/guidelines)
 *
 * @example
 * <ListItem headline="Title" supporting="Description" leadingIcon="res://ic_folder" />
 * <ListItem headline="Two-line item" supporting="Supporting text" trailingText="100+" />
 * <ListItem headline="Three-line item" supporting="Line one\nLine two" leadingImage="res://avatar" />
 */

/**
 * Property for setting the headline (primary text)
 */
const headlineProperty = new Property<ListItem, string>({
  name: "headline",
});

/**
 * Property for setting the supporting text (secondary text)
 */
const supportingProperty = new Property<ListItem, string>({
  name: "supporting",
});

/**
 * Property for setting the leading icon resource ID
 */
const leadingIconProperty = new Property<ListItem, string>({
  name: "leadingIcon",
});

/**
 * Property for setting the leading image resource ID
 */
const leadingImageProperty = new Property<ListItem, string>({
  name: "leadingImage",
});

/**
 * Property for setting the trailing text
 */
const trailingTextProperty = new Property<ListItem, string>({
  name: "trailingText",
});

/**
 * Property for setting the trailing icon resource ID
 */
const trailingIconProperty = new Property<ListItem, string>({
  name: "trailingIcon",
});

/**
 * Property for showing a trailing switch
 * @default false
 */
const showTrailingSwitchProperty = new Property<ListItem, boolean>({
  name: "showTrailingSwitch",
  defaultValue: false,
  valueConverter: booleanConverter,
});

/**
 * Property for the trailing switch checked state
 * @default false
 */
const trailingSwitchCheckedProperty = new Property<ListItem, boolean>({
  name: "trailingSwitchChecked",
  defaultValue: false,
  valueConverter: booleanConverter,
});

/**
 * Property for setting the container background color
 * @default 'surface'
 */
const containerColorProperty = new Property<ListItem, string>({
  name: "containerColor",
  defaultValue: "surface",
});

/**
 * Property for setting the headline text color
 * @default 'onSurface'
 */
const headlineColorProperty = new Property<ListItem, string>({
  name: "headlineColor",
  defaultValue: "onSurface",
});

/**
 * Property for setting the supporting text color
 * @default 'onSurfaceVariant'
 */
const supportingColorProperty = new Property<ListItem, string>({
  name: "supportingColor",
  defaultValue: "onSurfaceVariant",
});

/**
 * Property for enabling/disabling the list item
 * @default true
 */
const enabledProperty = new Property<ListItem, boolean>({
  name: "enabled",
  defaultValue: true,
  valueConverter: booleanConverter,
});

/**
 * Property for setting the selected state
 * @default false
 */
const selectedProperty = new Property<ListItem, boolean>({
  name: "selected",
  defaultValue: false,
  valueConverter: booleanConverter,
});

/**
 * Property for showing a divider below the item
 * @default false
 */
const showDividerProperty = new Property<ListItem, boolean>({
  name: "showDivider",
  defaultValue: false,
  valueConverter: booleanConverter,
});

export class ListItem extends ContentView {
  // Static properties
  /** Expose the tap event for use in XML or code */
  public static tapEvent = "tap";
  /** Event fired when the trailing switch state changes */
  public static switchChangeEvent = "switchChange";

  // Private instance properties - Native views
  /** The native Android LinearLayout container */
  private container: android.widget.LinearLayout;
  /** The content container (horizontal layout) */
  private contentLayout: android.widget.LinearLayout;
  /** The text container (vertical layout for headline and supporting) */
  private textLayout: android.widget.LinearLayout;
  /** The headline TextView */
  private headlineView: android.widget.TextView;
  /** The supporting text TextView */
  private supportingView: android.widget.TextView;
  /** The leading icon ImageView */
  private leadingIconView: android.widget.ImageView;
  /** The leading image (for avatars) */
  private leadingImageView: android.widget.ImageView;
  /** The trailing text TextView */
  private trailingTextView: android.widget.TextView;
  /** The trailing icon ImageView */
  private trailingIconView: android.widget.ImageView;
  /** The trailing switch */
  private trailingSwitchView: com.google.android.material.materialswitch.MaterialSwitch;
  /** The divider view */
  private dividerView: android.view.View;
  /** The ripple drawable for Material Design 3 */
  private rippleDrawable: android.graphics.drawable.RippleDrawable;

  // Private instance properties - Property backing fields
  private _headline: string;
  private _supporting: string;
  private _leadingIcon: string;
  private _leadingImage: string;
  private _trailingText: string;
  private _trailingIcon: string;
  private _showTrailingSwitch: boolean =
    showTrailingSwitchProperty.defaultValue;
  private _trailingSwitchChecked: boolean =
    trailingSwitchCheckedProperty.defaultValue;
  private _containerColor: string = containerColorProperty.defaultValue;
  private _headlineColor: string = headlineColorProperty.defaultValue;
  private _supportingColor: string = supportingColorProperty.defaultValue;
  private _enabled: boolean = enabledProperty.defaultValue;
  private _selected: boolean = selectedProperty.defaultValue;
  private _showDivider: boolean = showDividerProperty.defaultValue;
  /** Flag to prevent event loops when setting switch state programmatically */
  private _isUpdatingSwitch: boolean = false;

  // Constructor
  constructor() {
    super();
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  // Native property change handlers
  [headlineProperty.setNative](value: string): void {
    this._headline = value;
    this.applyHeadline();
  }

  [supportingProperty.setNative](value: string): void {
    this._supporting = value;
    this.applySupporting();
  }

  [leadingIconProperty.setNative](value: string): void {
    this._leadingIcon = value;
    this.applyLeadingIcon();
  }

  [leadingImageProperty.setNative](value: string): void {
    this._leadingImage = value;
    this.applyLeadingImage();
  }

  [trailingTextProperty.setNative](value: string): void {
    this._trailingText = value;
    this.applyTrailingText();
  }

  [trailingIconProperty.setNative](value: string): void {
    this._trailingIcon = value;
    this.applyTrailingIcon();
  }

  [showTrailingSwitchProperty.setNative](value: boolean): void {
    this._showTrailingSwitch = value;
    this.applyTrailingSwitch();
  }

  [trailingSwitchCheckedProperty.setNative](value: boolean): void {
    this._trailingSwitchChecked = value;
    this.applyTrailingSwitchChecked();
  }

  [containerColorProperty.setNative](value: string): void {
    this._containerColor = value;
    this.applyTheme();
  }

  [headlineColorProperty.setNative](value: string): void {
    this._headlineColor = value;
    this.applyTheme();
  }

  [supportingColorProperty.setNative](value: string): void {
    this._supportingColor = value;
    this.applyTheme();
  }

  [enabledProperty.setNative](value: boolean): void {
    this._enabled = value;
    this.applyEnabled();
  }

  [selectedProperty.setNative](value: boolean): void {
    this._selected = value;
    this.applyTheme();
  }

  [showDividerProperty.setNative](value: boolean): void {
    this._showDivider = value;
    this.applyDivider();
  }

  // Public getters and setters
  /**
   * Gets the Android context
   */
  get context(): android.content.Context {
    return this._context;
  }

  get headline(): string {
    return this._headline;
  }

  set headline(value: string) {
    this._headline = value;
    this.applyHeadline();
  }

  get supporting(): string {
    return this._supporting;
  }

  set supporting(value: string) {
    this._supporting = value;
    this.applySupporting();
  }

  get leadingIcon(): string {
    return this._leadingIcon;
  }

  set leadingIcon(value: string) {
    this._leadingIcon = value;
    this.applyLeadingIcon();
  }

  get leadingImage(): string {
    return this._leadingImage;
  }

  set leadingImage(value: string) {
    this._leadingImage = value;
    this.applyLeadingImage();
  }

  get trailingText(): string {
    return this._trailingText;
  }

  set trailingText(value: string) {
    this._trailingText = value;
    this.applyTrailingText();
  }

  get trailingIcon(): string {
    return this._trailingIcon;
  }

  set trailingIcon(value: string) {
    this._trailingIcon = value;
    this.applyTrailingIcon();
  }

  get showTrailingSwitch(): boolean {
    return this._showTrailingSwitch;
  }

  set showTrailingSwitch(value: boolean) {
    this._showTrailingSwitch = value;
    this.applyTrailingSwitch();
  }

  get trailingSwitchChecked(): boolean {
    return this._trailingSwitchChecked;
  }

  set trailingSwitchChecked(value: boolean) {
    this._trailingSwitchChecked = value;
    this.applyTrailingSwitchChecked();
  }

  get containerColor(): string {
    return this._containerColor;
  }

  set containerColor(value: string) {
    this._containerColor = value;
    this.applyTheme();
  }

  get headlineColor(): string {
    return this._headlineColor;
  }

  set headlineColor(value: string) {
    this._headlineColor = value;
    this.applyTheme();
  }

  get supportingColor(): string {
    return this._supportingColor;
  }

  set supportingColor(value: string) {
    this._supportingColor = value;
    this.applyTheme();
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.applyEnabled();
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.applyTheme();
  }

  get showDivider(): boolean {
    return this._showDivider;
  }

  set showDivider(value: boolean) {
    this._showDivider = value;
    this.applyDivider();
  }

  // Public methods
  /**
   * Creates the native Android view for the list item
   * @returns The native Android view
   */
  public createNativeView(): android.view.View {
    // Create main container (vertical layout to support divider)
    this.container = new android.widget.LinearLayout(this.context);
    this.container.setOrientation(android.widget.LinearLayout.VERTICAL);

    // Create content container (horizontal layout for the item content)
    this.contentLayout = new android.widget.LinearLayout(this.context);
    this.contentLayout.setOrientation(android.widget.LinearLayout.HORIZONTAL);
    this.contentLayout.setGravity(android.view.Gravity.CENTER_VERTICAL);

    // Material Design 3 specs: 16dp horizontal padding
    const horizontalPadding = this.dpToPx(16);
    // Vertical padding: 8dp for one-line, 12dp for two-line, 12dp for three-line
    const verticalPadding = this.dpToPx(8);
    this.contentLayout.setPadding(
      horizontalPadding,
      verticalPadding,
      horizontalPadding,
      verticalPadding
    );

    // Set minimum height according to Material Design 3 specs
    // One-line: 56dp, Two-line: 72dp, Three-line: 88dp
    this.contentLayout.setMinimumHeight(this.dpToPx(56));

    // Make it clickable and focusable
    this.contentLayout.setClickable(true);
    this.contentLayout.setFocusable(true);

    // Set accessibility role
    if (android.os.Build.VERSION.SDK_INT >= 28) {
      this.contentLayout.setAccessibilityHeading(false);
    }

    // Create ripple effect for Material Design 3 using foreground
    this.createRippleEffect();

    // Set up click listener
    this.contentLayout.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (view: android.view.View): void => {
          if (this._enabled) {
            this.notify({ eventName: ListItem.tapEvent, object: this });
          }
        },
      })
    );

    // Create leading icon ImageView
    this.leadingIconView = new android.widget.ImageView(this.context);
    const iconSize = this.dpToPx(24); // Material Design 3: 24dp
    const iconLayoutParams = new android.widget.LinearLayout.LayoutParams(
      iconSize,
      iconSize
    );
    iconLayoutParams.setMarginEnd(this.dpToPx(16)); // 16dp margin to text
    this.leadingIconView.setLayoutParams(iconLayoutParams);
    this.leadingIconView.setVisibility(android.view.View.GONE);
    this.leadingIconView.setImportantForAccessibility(
      android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO
    );

    // Create leading image ImageView (for avatars)
    this.leadingImageView = new android.widget.ImageView(this.context);
    const imageSize = this.dpToPx(40); // Material Design 3: 40dp for avatars
    const imageLayoutParams = new android.widget.LinearLayout.LayoutParams(
      imageSize,
      imageSize
    );
    imageLayoutParams.setMarginEnd(this.dpToPx(16)); // 16dp margin to text
    this.leadingImageView.setLayoutParams(imageLayoutParams);
    this.leadingImageView.setVisibility(android.view.View.GONE);
    this.leadingImageView.setImportantForAccessibility(
      android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO
    );

    // Create text container (vertical layout)
    this.textLayout = new android.widget.LinearLayout(this.context);
    this.textLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
    const textLayoutParams = new android.widget.LinearLayout.LayoutParams(
      0,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
    );
    textLayoutParams.weight = 1; // Take remaining space
    this.textLayout.setLayoutParams(textLayoutParams);

    // Create headline TextView
    this.headlineView = new android.widget.TextView(this.context);
    this.headlineView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 16); // Material Design 3: 16sp
    this.headlineView.setMaxLines(1);
    this.headlineView.setEllipsize(android.text.TextUtils.TruncateAt.END);

    // Create supporting TextView
    this.supportingView = new android.widget.TextView(this.context);
    this.supportingView.setTextSize(
      android.util.TypedValue.COMPLEX_UNIT_SP,
      14
    ); // Material Design 3: 14sp
    this.supportingView.setMaxLines(2); // Default to 2 lines (can be changed for three-line)
    this.supportingView.setEllipsize(android.text.TextUtils.TruncateAt.END);
    this.supportingView.setVisibility(android.view.View.GONE);

    // Create trailing text TextView
    this.trailingTextView = new android.widget.TextView(this.context);
    this.trailingTextView.setTextSize(
      android.util.TypedValue.COMPLEX_UNIT_SP,
      12
    ); // Material Design 3: 12sp for trailing text
    const trailingTextParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
    );
    trailingTextParams.setMarginStart(this.dpToPx(16)); // 16dp margin from text
    this.trailingTextView.setLayoutParams(trailingTextParams);
    this.trailingTextView.setVisibility(android.view.View.GONE);
    this.trailingTextView.setImportantForAccessibility(
      android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO
    );

    // Create trailing icon ImageView
    this.trailingIconView = new android.widget.ImageView(this.context);
    const trailingIconSize = this.dpToPx(24); // Material Design 3: 24dp
    const trailingIconParams = new android.widget.LinearLayout.LayoutParams(
      trailingIconSize,
      trailingIconSize
    );
    trailingIconParams.setMarginStart(this.dpToPx(16)); // 16dp margin from text
    this.trailingIconView.setLayoutParams(trailingIconParams);
    this.trailingIconView.setVisibility(android.view.View.GONE);
    this.trailingIconView.setImportantForAccessibility(
      android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO
    );

    // Create trailing switch (MaterialSwitch for MD3)
    this.trailingSwitchView =
      new com.google.android.material.materialswitch.MaterialSwitch(
        this.context
      );
    const trailingSwitchParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
    );
    trailingSwitchParams.setMarginStart(this.dpToPx(16)); // 16dp margin from text
    this.trailingSwitchView.setLayoutParams(trailingSwitchParams);
    this.trailingSwitchView.setVisibility(android.view.View.GONE);
    // Set up checked change listener
    this.trailingSwitchView.setOnCheckedChangeListener(
      new android.widget.CompoundButton.OnCheckedChangeListener({
        onCheckedChanged: (
          _buttonView: android.widget.CompoundButton,
          isChecked: boolean
        ): void => {
          if (!this._isUpdatingSwitch) {
            this._trailingSwitchChecked = isChecked;
            this.notify({
              eventName: ListItem.switchChangeEvent,
              object: this,
              value: isChecked,
            });
          }
        },
      })
    );

    // Create divider
    this.dividerView = new android.view.View(this.context);
    const dividerParams = new android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
      this.dpToPx(1)
    );
    // Divider starts after leading content according to Material Design 3
    dividerParams.setMarginStart(this.dpToPx(16));
    this.dividerView.setLayoutParams(dividerParams);
    this.dividerView.setVisibility(android.view.View.GONE);

    // Assemble the layout
    this.textLayout.addView(this.headlineView);
    this.textLayout.addView(this.supportingView);

    this.contentLayout.addView(this.leadingIconView);
    this.contentLayout.addView(this.leadingImageView);
    this.contentLayout.addView(this.textLayout);
    this.contentLayout.addView(this.trailingTextView);
    this.contentLayout.addView(this.trailingIconView);
    this.contentLayout.addView(this.trailingSwitchView);

    this.container.addView(this.contentLayout);
    this.container.addView(this.dividerView);

    // Apply initial state
    this.applyTheme();
    this.applyHeadline();
    this.applySupporting();
    this.applyLeadingIcon();
    this.applyLeadingImage();
    this.applyTrailingText();
    this.applyTrailingIcon();
    this.applyTrailingSwitch();
    this.applyTrailingSwitchChecked();
    this.applyEnabled();
    this.applyDivider();
    this.applyAccessibility();

    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );

    return this.container;
  }

  /**
   * Initializes the native view
   * Called by NativeScript after the native view is created
   */
  public initNativeView(): void {
    super.initNativeView();
  }

  /**
   * Disposes the native view and cleans up resources
   * Called by NativeScript when the view is no longer needed
   */
  public disposeNativeView(): void {
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    if (this.trailingSwitchView) {
      this.trailingSwitchView.setOnCheckedChangeListener(null);
    }
    this.container = null;
    this.contentLayout = null;
    this.textLayout = null;
    this.headlineView = null;
    this.supportingView = null;
    this.leadingIconView = null;
    this.leadingImageView = null;
    this.trailingTextView = null;
    this.trailingIconView = null;
    this.trailingSwitchView = null;
    this.dividerView = null;
    this.rippleDrawable = null;
    super.disposeNativeView();
  }

  // Private methods
  /**
   * Creates the ripple effect for Material Design 3
   * Uses foreground instead of background to preserve container color
   */
  private createRippleEffect(): void {
    if (!this.contentLayout) return;

    try {
      // Get ripple color from theme
      const rippleColor = getMaterialColor("onSurface", this.context);
      const rippleColorWithAlpha = android.graphics.Color.argb(
        32, // 12.5% alpha for Material Design 3
        android.graphics.Color.red(rippleColor),
        android.graphics.Color.green(rippleColor),
        android.graphics.Color.blue(rippleColor)
      );

      // Create color state list for ripple
      const rippleColorStateList = createColorStateList(rippleColorWithAlpha);

      // Create ripple drawable
      this.rippleDrawable = new android.graphics.drawable.RippleDrawable(
        rippleColorStateList,
        null, // null content drawable (we set background separately)
        null // null mask (ripple covers entire view)
      );

      // Apply ripple as foreground (API 23+)
      if (android.os.Build.VERSION.SDK_INT >= 23) {
        this.contentLayout.setForeground(this.rippleDrawable);
      } else {
        // Fallback for older Android versions
        const outValue = new android.util.TypedValue();
        this.context
          .getTheme()
          .resolveAttribute(
            android.R.attr.selectableItemBackground,
            outValue,
            true
          );
        this.contentLayout.setBackgroundResource(outValue.resourceId);
      }
    } catch (error) {
      console.error("ListItem: Failed to create ripple effect", error);
    }
  }

  /**
   * Handles system appearance (dark/light mode) changes
   * @param event - The system appearance change event
   */
  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    this.applyTheme(event.newValue === "dark");
  }

  /**
   * Applies the current theme colors to the list item
   * Called when colors change or system theme changes
   */
  private applyTheme(
    isDarkMode = systemStates.systemAppearance === "dark"
  ): void {
    try {
      // Only apply if container is initialized
      if (!this.container) return;

      const containerColor = this._selected
        ? getMaterialColor("secondaryContainer", this.context)
        : getMaterialColor(this._containerColor, this.context);

      const headlineColor = this._selected
        ? getMaterialColor("onSecondaryContainer", this.context)
        : getMaterialColor(this._headlineColor, this.context);

      const supportingColor = this._selected
        ? getMaterialColor("onSecondaryContainer", this.context)
        : getMaterialColor(this._supportingColor, this.context);

      // Set background color on content layout (ripple is in foreground)
      if (this.contentLayout) {
        this.contentLayout.setBackgroundColor(containerColor);
      }

      if (this.headlineView) {
        this.headlineView.setTextColor(headlineColor);
      }

      if (this.supportingView) {
        this.supportingView.setTextColor(supportingColor);
      }

      if (this.trailingTextView) {
        this.trailingTextView.setTextColor(supportingColor);
      }

      // Apply tint to icons
      const iconTint = createColorStateList(supportingColor);
      if (this.leadingIconView) {
        this.leadingIconView.setImageTintList(iconTint);
      }
      if (this.trailingIconView) {
        this.trailingIconView.setImageTintList(iconTint);
      }

      // Apply divider color
      if (this.dividerView) {
        const dividerColor = getMaterialColor("outlineVariant", this.context);
        this.dividerView.setBackgroundColor(dividerColor);
      }

      // Update ripple color if needed
      this.updateRippleColor();

      // Update trailing switch theme if visible
      if (this._showTrailingSwitch) {
        this.applyTrailingSwitchTheme();
      }
    } catch (error) {
      // Silently ignore errors during initialization when views might not be ready
    }
  }

  /**
   * Updates the ripple effect color based on current theme
   */
  private updateRippleColor(): void {
    if (!this.rippleDrawable || android.os.Build.VERSION.SDK_INT < 23) return;

    try {
      const rippleColor = getMaterialColor("onSurface", this.context);
      const rippleColorWithAlpha = android.graphics.Color.argb(
        32, // 12.5% alpha for Material Design 3
        android.graphics.Color.red(rippleColor),
        android.graphics.Color.green(rippleColor),
        android.graphics.Color.blue(rippleColor)
      );

      this.rippleDrawable.setColor(createColorStateList(rippleColorWithAlpha));
    } catch (error) {
      console.error("ListItem: Failed to update ripple color", error);
    }
  }

  /**
   * Applies the headline text
   */
  private applyHeadline(): void {
    if (!this.headlineView) return;
    this.headlineView.setText(this._headline || "");
    this.applyAccessibility();
  }

  /**
   * Applies the supporting text
   */
  private applySupporting(): void {
    if (!this.supportingView) return;
    if (this._supporting) {
      this.supportingView.setText(this._supporting);
      this.supportingView.setVisibility(android.view.View.VISIBLE);
      // Adjust height based on number of lines
      if (this.contentLayout) {
        this.contentLayout.setMinimumHeight(this.dpToPx(72)); // Two-line minimum
      }
    } else {
      this.supportingView.setVisibility(android.view.View.GONE);
      if (this.contentLayout) {
        this.contentLayout.setMinimumHeight(this.dpToPx(56)); // One-line minimum
      }
    }
    this.applyAccessibility();
  }

  /**
   * Applies the leading icon
   */
  private applyLeadingIcon(): void {
    if (!this.leadingIconView) return;

    if (this._leadingIcon && this._leadingIcon.startsWith("res://")) {
      const iconName = this._leadingIcon.replace("res://", "");
      const resId = getResource(iconName, "drawable", this.context);
      if (resId) {
        this.leadingIconView.setImageResource(resId);
        this.leadingIconView.setVisibility(android.view.View.VISIBLE);
        if (this.leadingImageView) {
          this.leadingImageView.setVisibility(android.view.View.GONE);
        }
      } else {
        console.error(`ListItem: Icon resource not found: ${iconName}`);
        this.leadingIconView.setVisibility(android.view.View.GONE);
      }
    } else {
      this.leadingIconView.setVisibility(android.view.View.GONE);
    }
  }

  /**
   * Applies the leading image
   */
  private applyLeadingImage(): void {
    if (!this.leadingImageView) return;

    if (this._leadingImage && this._leadingImage.startsWith("res://")) {
      const imageName = this._leadingImage.replace("res://", "");
      const resId = getResource(imageName, "drawable", this.context);
      if (resId) {
        this.leadingImageView.setImageResource(resId);
        this.leadingImageView.setVisibility(android.view.View.VISIBLE);
        if (this.leadingIconView) {
          this.leadingIconView.setVisibility(android.view.View.GONE);
        }
      } else {
        console.error(`ListItem: Image resource not found: ${imageName}`);
        this.leadingImageView.setVisibility(android.view.View.GONE);
      }
    } else {
      this.leadingImageView.setVisibility(android.view.View.GONE);
    }
  }

  /**
   * Applies the trailing text
   */
  private applyTrailingText(): void {
    if (!this.trailingTextView) return;

    if (this._trailingText) {
      this.trailingTextView.setText(this._trailingText);
      this.trailingTextView.setVisibility(android.view.View.VISIBLE);
    } else {
      this.trailingTextView.setVisibility(android.view.View.GONE);
    }
  }

  /**
   * Applies the trailing icon
   */
  private applyTrailingIcon(): void {
    if (!this.trailingIconView) return;

    if (this._trailingIcon && this._trailingIcon.startsWith("res://")) {
      const iconName = this._trailingIcon.replace("res://", "");
      const resId = getResource(iconName, "drawable", this.context);
      if (resId) {
        this.trailingIconView.setImageResource(resId);
        this.trailingIconView.setVisibility(android.view.View.VISIBLE);
        // Hide switch when icon is shown
        if (this.trailingSwitchView) {
          this.trailingSwitchView.setVisibility(android.view.View.GONE);
        }
      } else {
        console.error(`ListItem: Icon resource not found: ${iconName}`);
        this.trailingIconView.setVisibility(android.view.View.GONE);
      }
    } else {
      this.trailingIconView.setVisibility(android.view.View.GONE);
    }
  }

  /**
   * Applies the trailing switch visibility
   */
  private applyTrailingSwitch(): void {
    if (!this.trailingSwitchView) return;

    if (this._showTrailingSwitch) {
      this.trailingSwitchView.setVisibility(android.view.View.VISIBLE);
      // Hide icon and text when switch is shown (switch takes precedence)
      if (this.trailingIconView) {
        this.trailingIconView.setVisibility(android.view.View.GONE);
      }
      if (this.trailingTextView) {
        this.trailingTextView.setVisibility(android.view.View.GONE);
      }
      // Apply switch theme colors
      this.applyTrailingSwitchTheme();
    } else {
      this.trailingSwitchView.setVisibility(android.view.View.GONE);
    }
  }

  /**
   * Applies the trailing switch checked state
   */
  private applyTrailingSwitchChecked(): void {
    if (!this.trailingSwitchView) return;

    try {
      this._isUpdatingSwitch = true;
      // Ensure we pass a proper boolean (not string "true"/"false")
      const isChecked = this._trailingSwitchChecked === true;
      this.trailingSwitchView.setChecked(isChecked);
    } catch (error) {
      console.error("ListItem: Failed to apply switch checked state", error);
    } finally {
      this._isUpdatingSwitch = false;
    }
  }

  /**
   * Applies Material Design 3 theme colors to the trailing switch
   */
  private applyTrailingSwitchTheme(): void {
    if (!this.trailingSwitchView) return;

    try {
      // Get MD3 colors
      const checkedTrackColor = getMaterialColor("primary", this.context);
      const uncheckedTrackColor = getMaterialColor(
        "surfaceContainerHighest",
        this.context
      );
      const checkedThumbColor = getMaterialColor("onPrimary", this.context);
      const uncheckedThumbColor = getMaterialColor("outline", this.context);
      const uncheckedBorderColor = getMaterialColor("outline", this.context);

      // Create color state lists
      const trackColorStateList = createColorStateList(
        checkedTrackColor,
        uncheckedTrackColor
      );
      const thumbColorStateList = createColorStateList(
        checkedThumbColor,
        uncheckedThumbColor
      );
      const borderColorStateList = createColorStateList(
        checkedTrackColor,
        uncheckedBorderColor
      );

      // Apply colors
      this.trailingSwitchView.setTrackTintList(trackColorStateList);
      this.trailingSwitchView.setThumbTintList(thumbColorStateList);
      this.trailingSwitchView.setTrackDecorationTintList(borderColorStateList);
    } catch (error) {
      console.error("ListItem: Failed to apply switch theme", error);
    }
  }

  /**
   * Applies the enabled state
   */
  private applyEnabled(): void {
    try {
      // Only apply if both container and contentLayout are initialized
      if (!this.container || !this.contentLayout) return;

      this.contentLayout.setEnabled(this._enabled);
      this.contentLayout.setClickable(this._enabled);

      if (this.headlineView) {
        this.headlineView.setAlpha(this._enabled ? 1.0 : 0.38); // Material Design 3 disabled alpha
      }
      if (this.supportingView) {
        this.supportingView.setAlpha(this._enabled ? 1.0 : 0.38);
      }
      if (this.trailingSwitchView) {
        this.trailingSwitchView.setEnabled(this._enabled);
      }

      this.applyAccessibility();
    } catch (error) {
      // Silently ignore errors during initialization when views might not be ready
    }
  }

  /**
   * Applies the divider visibility
   */
  private applyDivider(): void {
    if (!this.dividerView) return;

    this.dividerView.setVisibility(
      this._showDivider ? android.view.View.VISIBLE : android.view.View.GONE
    );
  }

  /**
   * Applies accessibility features for screen readers
   */
  private applyAccessibility(): void {
    if (!this.contentLayout) return;

    try {
      // Build content description
      let contentDescription = "";

      if (this._headline) {
        contentDescription = this._headline;
      }

      if (this._supporting) {
        contentDescription += `, ${this._supporting}`;
      }

      if (this._trailingText) {
        contentDescription += `, ${this._trailingText}`;
      }

      if (this._showTrailingSwitch) {
        contentDescription += `, switch ${this._trailingSwitchChecked ? "on" : "off"}`;
      }

      if (this._selected) {
        contentDescription += ", selected";
      }

      if (!this._enabled) {
        contentDescription += ", disabled";
      }

      // Set content description
      if (contentDescription) {
        this.contentLayout.setContentDescription(contentDescription);
      }

      // Make the content layout important for accessibility
      this.contentLayout.setImportantForAccessibility(
        android.view.View.IMPORTANT_FOR_ACCESSIBILITY_YES
      );
    } catch (error) {
      console.error("ListItem: Failed to apply accessibility", error);
    }
  }

  /**
   * Converts DP to pixels
   * @param dp - The value in DP
   * @returns The value in pixels
   */
  private dpToPx(dp: number): number {
    return Math.round(
      dp * this.context.getResources().getDisplayMetrics().density
    );
  }
}

/**
 * Register custom properties with NativeScript
 * This allows the properties to be set via XML attributes
 */
headlineProperty.register(ListItem);
supportingProperty.register(ListItem);
leadingIconProperty.register(ListItem);
leadingImageProperty.register(ListItem);
trailingTextProperty.register(ListItem);
trailingIconProperty.register(ListItem);
showTrailingSwitchProperty.register(ListItem);
trailingSwitchCheckedProperty.register(ListItem);
containerColorProperty.register(ListItem);
headlineColorProperty.register(ListItem);
supportingColorProperty.register(ListItem);
enabledProperty.register(ListItem);
selectedProperty.register(ListItem);
showDividerProperty.register(ListItem);
