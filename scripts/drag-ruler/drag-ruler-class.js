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
import { MODULE_ID, log } from "../module.js";


// Dangerous!
import { findPath, isPathfindingEnabled } from "../../../drag-ruler/js/pathfinding.js";
import {
  getGridPositionFromPixelsObj,
  getPixelsFromGridPositionObj
} from "../../../drag-ruler/js/foundry_fixes.js";
import { getSnapPointForTokenObj, getSnapPointForEntity, getMeasurePosition } from "../../../drag-ruler/js/util.js";
import { disableSnap } from "../../../drag-ruler/js/keybindings.js";

// For game.settings.get
const settingsKey = "drag-ruler"; // eslint-disable-line no-unused-vars


/* Checklist
Methods from https://github.com/manuelVo/foundryvtt-drag-ruler/blob/develop/js/ruler.js

Types of ways to handle drag ruler methods:
1. Incorporated into DragRulerRuler class below, extending (wrapping) LibRuler
2. Alias to other method
3. Adding as new method by copying directly from original DragRulerRuler
4. Incorporating into DragRulerSegment in separate file, extending (wrapping) LibRulerSegment

√ constructor: In DragRulerRuler.constructor
√ clear: In DragRulerRuler.prototype.clear (wrap from LibRuler)
√ moveToken: In DragRulerRuler.prototype.moveToken (wrap from LibRuler)
√ toJSON: Imported from DragRulerRuler.prototype.toJSON (wrap from LibRuler)
√ update: Imported from DragRulerRuler.prototype.update (wrap from LibRuler)
√ measure: In DragRulerRuler.prototype.measure (wrap from LibRuler)
  See also:
  - DragRulerSegment.prototype.drawDistanceLabel
  - DragRulerSegment.prototype.highlightPosition

√ _endMeasurement: Imported from DragRulerRuler.prototype._endMeasurement (wrap from Ruler)
√ dragRulerAddWaypoint: Aliased to _addWaypoint (wrap from LibRuler)
√ dragRulerAddWaypointHistory: Imported from DragRulerRuler.prototype.dragRulerAddWaypointHistory (new)
√ dragRulerClearWaypoints: Aliased to _clearWaypoints (wrap from LibRuler)
√ dragRulerDeleteWaypoint: Imported from DragRulerRuler.prototype.dragRulerDeleteWaypoint (new)
√ dragRulerRemovePathfindingWaypoints: Imported from DragRulerRuler.prototype.dragRulerRemovePathfindingWaypoints (new)
√ dragRulerAbortDrag: Imported from DragRulerRuler.prototype.dragRulerAbortDrag (new)
√ dragRulerRecalculate: Imported from DragRulerRuler.prototype.dragRulerAbortDrag (new)
√ dragRulerGetRaysFromWaypoints: Imported from DragRulerRuler.dragRulerGetRaysFromWaypoints (new)
√ dragRulerGetColorForDistance: In DragRulerSegment.prototype.colorForPosition
√ dragRulerStart: Imported from DragRulerRuler.prototype.dragRulerStart (new)
√ dragRulerSendState: Imported from Imported from DragRulerRuler.prototype.dragRulerSendState (new)

*/

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
   * @wrap from LibRuler
   */
  clear() {
    super.clear();
    this.previousWaypoints = [];
    this.previousLabels.removeChildren().forEach(c => c.destroy());
    this.dragRulerRanges = undefined;
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
    // _getMovementToken will fail if no waypoints b/c it gets the token based on the
    // first waypoint.
    // This leads to a catch-22, wherein _addWaypoint, below, wants a token so it
    // can adjust the snap location for the waypoint, but we need a waypoint first!

    const token = this.draggedEntity ||
      (this.waypoints.length ? this._getMovementToken() : undefined);
    if ( token instanceof Token ) return token;
    return null;
  }

  /**
   * Helper to get us out of the catch-22 in dragRulerToken.
   * Replicates Ruler._getMovementToken but gets the controlled token for a given position
   * @param {Point} point
   * @return {Token|null}
   */
  _getTokenAtPosition(point) {
    let tokens = canvas.tokens.controlled;
    if ( !tokens.length && game.user.character ) { tokens = game.user.character.getActiveTokens(); }
    if ( !tokens.length ) { return null; }
    return tokens.find(t => {
      let pos = new PIXI.Rectangle(t.x - 1, t.y - 1, t.w + 2, t.h + 2);
      return pos.contains(point.x, point.y);
    });
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
        if (options.snap) { path = path.slice(0, path.length - 1); }

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

  /**
   * @wrap from LibRuler
   */
  _addWaypoint(point, options = {}) {
    options.snap ??= true;
    const token = this.dragRulerToken()
      || (this.waypoints.length ? undefined : this._getTokenAtPosition(point.x, point.y));

    if ( options.snap && token ) {
      point = getSnapPointForEntity(point.x, point.y, token);
      options.center = false;
    }

    super._addWaypoint(point, options);

    this.waypoints.filter(waypoint => waypoint.isPathfinding).forEach(waypoint => waypoint.isPathfinding = false);
  }

  // Alias so dragRulerStart need not be modified
  dragRulerAddWaypoint(point, options = {}) { this._addWaypoint(point, options); }

  // Alias so dragRulerRecalculate need not be modified
  dragRulerClearWaypoints() { this._clearWaypoints(); }

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

  Object.defineProperty(DragRulerRuler.prototype, "dragRulerAddWaypointHistory", {
    value: dr.prototype.dragRulerAddWaypointHistory,
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

  updateDragRulerKeybindings();
}

function updateDragRulerKeybindings() {
  // Pathfinding works with regular ruler but does not update immediately because
  // the toggle only triggers a re-measure for drag rulers
  // Change to working for all rulers
  game.keybindings.register(MODULE_ID, "togglePathfinding", {
		name: "drag-ruler.keybindings.togglePathfinding.name",
		hint: "drag-ruler.keybindings.togglePathfinding.hint",
		onDown: libRulerHandleTogglePathfinding,
		onUp: libRulerHandleTogglePathfinding,
		precedence: -1,
		restricted: !game.settings.get(settingsKey, "allowPathfinding"),
	});
}

function libRulerHandleTogglePathfinding(event) {
  // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/keybindings.js#L128
  log(`libRulerHandleTogglePathfinding| pathfinding toggled`);

	const ruler = canvas.controls.ruler;
	if (ruler?.isDragRuler || ruler._state !== Ruler.STATES.MEASURING) { return false; } // Don't repeat if already done

  log(`libRulerHandleTogglePathfinding| pathfinding measure starting`);
	ruler.measure(getMeasurePosition(), {snap: !disableSnap});
	ruler.dragRulerSendState();
	return false;
}
