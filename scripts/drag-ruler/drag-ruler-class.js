/* globals
PIXI,
Ruler,
Token,
game,
PreciseText,
CONFIG
*/
"use strict";

/*
Extend LibRuler class with methods expected by Drag Ruler module.
https://github.com/manuelVo/foundryvtt-drag-ruler/blob/develop/js/ruler.js
https://github.com/manuelVo/foundryvtt-drag-ruler/blob/develop/js/foundry_imports.js (measure)
*/

import { LibRuler } from "../ruler-class.js";


// Dangerous!
import { findPath, isPathfindingEnabled } from "../../../drag-ruler/js/pathfinding.js";
import {
  getGridPositionFromPixelsObj,
  getPixelsFromGridPositionObj
} from "../../../drag-ruler/js/foundry_fixes.js";
import { getSnapPointForTokenObj } from "../../../drag-ruler/js/util.js";

// For game.settings.get
const settingsKey = "drag-ruler"; // eslint-disable-line no-unused-vars

export class DragRulerRuler extends LibRuler {

  /**
   * @wrap from Ruler
   * @param {User}  The User for whom to construct the Ruler instance
   * @type {PIXI.Container}
   */
  constructor(user, { color = null } = {}) {
    super(user, { color });
    this.previousWaypoints = [];
    this.previousLabels = this.addChild(new PIXI.Container());
  }

  /**
   * Is this a ruler for dragging entities?
   */
  get isDragRuler() {
    return Boolean(this.draggedEntity) && this._state !== Ruler.STATES.INACTIVE;
  }

  /**
   * @wrap from Ruler
   */
  clear() {
    super.clear();
    this.previousWaypoints = [];
    this.previousLabels.removeChildren().forEach(c => c.destroy());
    this.dragRulerRanges = undefined;
    this.cancelScheduledMeasurement();
  }

  /**
   * @mixed from LibRuler
   * @return {Promise<boolean>}    An indicator for whether a token was successfully moved or not.
   *                               If True the event should be prevented from propagating further.
   *                               If False it should move on to other handlers.
   */
  async moveToken(event) {
    // Disable moveToken if Drag Ruler is active
    return this.isDragRuler ? Promise.resolve(true) : ( await super.moveToken(event) );
  }

  /**
   * Helper to get a token that is recognized by Drag Ruler.
   * @return {Token|null}
   */
  dragRulerToken() {
    const token = this._getMovementToken();
    if ( token instanceof Token ) return token;
    return null;
  }

  /**
   * @wrap from LibRuler
   */
  measure(destination, options) {
    // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/ruler.js#L64
    if ( this.isDragRuler && this.user !== game.user ) {
      options.snap = false;
    }

    // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/foundry_imports.js#L174
    const token = this.dragRulerToken();
    this.dragRulerRemovePathfindingWaypoints();

    if ( token && isPathfindingEnabled.call(this) ) {
      const from = getGridPositionFromPixelsObj(this.waypoints[this.waypoints.length - 1]);
      const to = getGridPositionFromPixelsObj(destination);
      let path = findPath(from, to, token, this.waypoints);
      if (path) { path.shift(); }
      if (path && path.length > 0) {
        path = path.map(point => getSnapPointForTokenObj(getPixelsFromGridPositionObj(point), token));

        // If the token is snapped to the grid, the first point of the path is already handled by the ruler
        if (path[0].x === this.waypoints[this.waypoints.length - 1].x
          && path[0].y === this.waypoints[this.waypoints.length - 1].y) { path = path.slice(1); }

        // If snapping is enabled, the last point of the path is already handled by the ruler
        if (options.snap)
          { path = path.slice(0, path.length - 1); }

        for (const point of path) {
          point.isPathfinding = true;
          this.labels.addChild(new PreciseText("", CONFIG.canvasTextStyle));
        }
        this.waypoints = this.waypoints.concat(path);
      } else {
        // Don't show a path if the pathfinding yields no result to show the user that the destination is unreachable
        destination = this.waypoints[this.waypoints.length - 1];
      }
    }

    return super.measure(destination, options);
  }
}


// Add methods directly from Drag Ruler's module, when possible
export function registerDragRulerMethods() {

  const dr = window.libRuler.DragRulerOriginal;

  // @wrap from LibRuler
  Object.defineProperty(DragRulerRuler.prototype, "toJSON", {
    value: dr.prototype.toJSON,
    writable: true,
    configurable: true
  });

  // @wrap from LibRuler
  Object.defineProperty(DragRulerRuler.prototype, "update", {
    value: dr.prototype.update,
    writable: true,
    configurable: true
  });

  // @wrap from Ruler
  Object.defineProperty(DragRulerRuler.prototype, "_endMeasurement", {
    value: dr.prototype._endMeasurement,
    writable: true,
    configurable: true
  });

  // Rest are additions by DragRuler

//   Object.defineProperty(DragRulerRuler.prototype, "dragRulerAddWaypoint", {
//     value: dr.prototype.dragRulerAddWaypoint,
//     writable: true,
//     configurable: true
//   });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerAddWaypointHistory", {
    value: dr.prototype.dragRulerAddWaypointHistory,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerClearWaypoints", {
    value: dr.prototype.dragRulerClearWaypoints,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerDeleteWaypoint", {
    value: dr.prototype.dragRulerDeleteWaypoint,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerRemovePathfindingWaypoints", {
    value: dr.prototype.dragRulerRemovePathfindingWaypoints,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerAbortDrag", {
    value: dr.prototype.dragRulerAbortDrag,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerRecalculate", {
    value: dr.prototype.dragRulerRecalculate,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler, "dragRulerGetRaysFromWaypoints", {
    value: dr.dragRulerGetRaysFromWaypoints,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerGetColorForDistance", {
    value: dr.prototype.dragRulerGetColorForDistance,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerStart", {
    value: dr.prototype.dragRulerStart,
    writable: true,
    configurable: true
  });

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerSendState", {
    value: dr.prototype.dragRulerSendState,
    writable: true,
    configurable: true
  });
}
