/**
 * Lane management system for 3-lane gameplay
 * Handles lane positioning, switching, and validation
 */

const lanes = {
  // Canvas width for lane calculations
  canvasWidth: 800,

  // Current lane (0=left, 1=center, 2=right)
  currentLane: 1,

  /**
   * Get the width of each lane
   * @returns {number} Width of one lane in pixels
   */
  get laneWidth() {
    return this.canvasWidth / 3;
  },

  /**
   * Get the X position (center) of a lane
   * @param {number} laneIndex - Lane index (0, 1, or 2)
   * @returns {number} X coordinate of lane center
   * @throws {Error} If lane index is invalid
   */
  getLaneX(laneIndex) {
    if (!this.isValidLane(laneIndex)) {
      throw new Error(`Invalid lane index: ${laneIndex}. Must be 0, 1, or 2.`);
    }
    const laneWidth = this.laneWidth;
    return laneIndex * laneWidth + laneWidth / 2;
  },

  /**
   * Check if a lane index is valid
   * @param {number} laneIndex - Lane index to validate
   * @returns {boolean} True if lane index is 0, 1, or 2
   */
  isValidLane(laneIndex) {
    return laneIndex === 0 || laneIndex === 1 || laneIndex === 2;
  },

  /**
   * Switch lanes relative to current position
   * @param {number} direction - Direction to move (-1 for left, +1 for right)
   * @returns {boolean} True if switch was successful, false if blocked
   */
  switchLane(direction) {
    const newLane = this.currentLane + direction;
    if (!this.isValidLane(newLane)) {
      return false;
    }
    this.currentLane = newLane;
    return true;
  }
};
