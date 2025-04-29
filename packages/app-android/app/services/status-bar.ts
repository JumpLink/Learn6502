import { Application, type SystemAppearanceChangedEventData } from '@nativescript/core'
import { lifecycleEvents, setStatusBarAppearance } from '../utils/index';

const onSystemAppearanceChanged = (event: SystemAppearanceChangedEventData): void => {
    const isDarkMode = event.newValue === 'dark';
    setStatusBarAppearance("md_theme_surface", isDarkMode);
}

export const initStatusBar = () => {
    lifecycleEvents.on(Application.systemAppearanceChangedEvent, onSystemAppearanceChanged);
    setStatusBarAppearance("md_theme_surface");
}
