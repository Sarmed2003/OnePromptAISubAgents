class Lanes {
  constructor() {
    this.lanes = [
      { id: 0, x: 25, width: 250 },
      { id: 1, x: 275, width: 250 },
      { id: 2, x: 525, width: 250 }
    ];
    this.currentLane = 0;
  }

  getLaneX(laneId) {
    if (laneId < 0 || laneId > 2) {
      throw new Error(`Invalid lane ID: ${laneId}. Must be 0, 1, or 2.`);
    }
    return this.lanes[laneId].x;
  }

  switchLane(newLaneId) {
    if (newLaneId < 0 || newLaneId > 2) {
      throw new Error(`Invalid lane ID: ${newLaneId}. Must be 0, 1, or 2.`);
    }
    this.currentLane = newLaneId;
  }

  getLaneWidth() {
    return this.lanes[0].width;
  }
}

const lanesManager = new Lanes();

export { Lanes, lanesManager };
