import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import {
  ThemeService,
  NotificationService,
  FileService,
  UIService,
  GamepadService,
} from "./services/index";

/**
 * Central services class that manages controller instances
 * This provides a single access point for all controller services
 */
export class Services {
  // Controllers
  private _themeManager?: ThemeService;
  private _notificationService?: NotificationService;
  private _fileManager?: FileService;
  private _uiController?: UIService;
  private _gamepadController?: GamepadService;

  // Whether the services have been fully initialized
  private _initialized = false;

  // Singleton instance
  private static _instance: Services | null = null;

  /**
   * Get singleton instance
   */
  public static getInstance(): Services {
    if (!Services._instance) {
      Services._instance = new Services();
    }
    return Services._instance;
  }

  /**
   * Initialize with window and toast overlay
   * Must be called to configure services with UI components
   * This should happen AFTER GTK initialization is complete
   */
  public init(
    window: Adw.ApplicationWindow,
    toastOverlay: Adw.ToastOverlay
  ): void {
    if (this._initialized) {
      console.log("Services already initialized");
      return;
    }

    try {
      // Create controllers that require UI references
      this._notificationService = new NotificationService(window, toastOverlay);
      this._fileManager = new FileService(window);
      this._uiController = new UIService(window, toastOverlay);

      // Create controllers that access GTK/GDK APIs
      // (Now safe since GTK is initialized)
      this._themeManager = new ThemeService();
      this._gamepadController = new GamepadService();

      this._initialized = true;
      console.log("Services initialized successfully");
    } catch (error) {
      console.error("Error initializing services:", error);
      // Even if some controllers fail, mark as initialized to prevent further attempts
      this._initialized = true;
    }
  }

  /**
   * Initialize unsaved changes indicator
   */
  public setUnsavedChangesIndicator(indicator: Gtk.Button): void {
    if (this._fileManager) {
      this._fileManager.setUnsavedChangesIndicator(indicator);
    }
    if (this._uiController) {
      this._uiController.setUnsavedChangesIndicator(indicator);
    }
  }

  /**
   * Get theme manager
   */
  public get themeManager(): ThemeService {
    this.checkController(this._themeManager, "ThemeManager");
    return this._themeManager!;
  }

  /**
   * Get notification service
   */
  public get notificationService(): NotificationService {
    this.checkController(this._notificationService, "NotificationService");
    return this._notificationService!;
  }

  /**
   * Get file manager
   */
  public get fileManager(): FileService {
    this.checkController(this._fileManager, "FileManager");
    return this._fileManager!;
  }

  /**
   * Get UI controller
   */
  public get uiController(): UIService {
    this.checkController(this._uiController, "UIController");
    return this._uiController!;
  }

  /**
   * Get gamepad controller
   */
  public get gamepadController(): GamepadService {
    this.checkController(this._gamepadController, "GamepadController");
    return this._gamepadController!;
  }

  /**
   * Check if controller is initialized, throw error if not
   */
  private checkController<T>(controller: T | undefined, name: string): void {
    if (controller === undefined) {
      console.error(`${name} not initialized.`);
      throw new Error(
        `${name} not initialized. Make sure services.init() was called.`
      );
    }
  }

  private constructor() {
    // Don't initialize any UI components here
    // to avoid calling GTK/GDK before initialization
  }
}

// Create and export singleton instance
// Note: Only creates the instance shell, doesn't initialize UI components
export const services = Services.getInstance();
