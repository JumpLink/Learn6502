/**
 * Service containing platform-independent business logic for learn state management
 * Handles scroll position and learning progress state
 */
export class LearnStateService {
  // State tracking
  private _lastScrollPosition: number = 0;
  private _currentSection: string = "";
  private _completedSections: Set<string> = new Set();

  /**
   * Get the last saved scroll position
   */
  public get lastScrollPosition(): number {
    return this._lastScrollPosition;
  }

  /**
   * Set the last saved scroll position
   */
  public set lastScrollPosition(position: number) {
    this._lastScrollPosition = Math.max(0, position);
  }

  /**
   * Save the current scroll position
   * @param position Current scroll position
   */
  public saveScrollPosition(position: number): void {
    this.lastScrollPosition = position;
  }

  /**
   * Get the last saved scroll position (alias for lastScrollPosition getter)
   * @returns The last scroll position
   */
  public getLastScrollPosition(): number {
    return this._lastScrollPosition;
  }

  /**
   * Get the current section being viewed
   */
  public get currentSection(): string {
    return this._currentSection;
  }

  /**
   * Set the current section being viewed
   */
  public set currentSection(section: string) {
    this._currentSection = section;
  }

  /**
   * Mark a section as completed
   * @param sectionId Section identifier
   */
  public markSectionCompleted(sectionId: string): void {
    this._completedSections.add(sectionId);
  }

  /**
   * Check if a section is completed
   * @param sectionId Section identifier
   * @returns True if section is completed
   */
  public isSectionCompleted(sectionId: string): boolean {
    return this._completedSections.has(sectionId);
  }

  /**
   * Get all completed sections
   * @returns Array of completed section IDs
   */
  public getCompletedSections(): string[] {
    return Array.from(this._completedSections);
  }

  /**
   * Clear all progress data
   */
  public clearProgress(): void {
    this._completedSections.clear();
    this._lastScrollPosition = 0;
    this._currentSection = "";
  }

  /**
   * Get learning progress as percentage
   * @param totalSections Total number of sections
   * @returns Progress percentage (0-100)
   */
  public getProgressPercentage(totalSections: number): number {
    if (totalSections === 0) return 0;
    return Math.round((this._completedSections.size / totalSections) * 100);
  }

  /**
   * Export progress data for persistence
   * @returns Serializable progress data
   */
  public exportProgress(): {
    scrollPosition: number;
    currentSection: string;
    completedSections: string[];
  } {
    return {
      scrollPosition: this._lastScrollPosition,
      currentSection: this._currentSection,
      completedSections: Array.from(this._completedSections),
    };
  }

  /**
   * Import progress data from persistence
   * @param data Progress data to import
   */
  public importProgress(data: {
    scrollPosition?: number;
    currentSection?: string;
    completedSections?: string[];
  }): void {
    if (data.scrollPosition !== undefined) {
      this._lastScrollPosition = data.scrollPosition;
    }
    if (data.currentSection !== undefined) {
      this._currentSection = data.currentSection;
    }
    if (data.completedSections) {
      this._completedSections = new Set(data.completedSections);
    }
  }
}

// Export singleton instance
export const learnStateService = new LearnStateService();
