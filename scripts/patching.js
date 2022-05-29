/* globals
libWrapper,
Ruler
*/

'use strict';

import { MODULE_ID, log } from "./module.js";

import { libRulerMeasure,

         libRulerSetDestination,
         libRulerAddWaypoint,
         libRulerRemoveWaypoint,

         libRulerOnMouseMove,
         libRulerScheduleMeasurement,
         libRulerDeferMeasurement,
         libRulerCancelScheduledMeasurement,
         libRulerDoDeferredMeasurements
       } from "./ruler-measure.js";

import { libRulerToJSON,
         libRulerUpdate,

         libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag
       } from "./ruler-flags.js";

import { libRulerMoveToken,

         libRulerTestForCollision,
         libRulerAnimateToken
       } from "./ruler-move-token.js";

import { RulerSegment } from "./segment.js";

export function registerLibRuler() {
  libWrapper.register(MODULE_ID, 'Ruler.prototype.measure', libRulerMeasure, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype.moveToken', libRulerMoveToken, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype._highlightMeasurement', RulerSegment.prototype.highlightMeasurement, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype._addWaypoint', libRulerAddWaypoint, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype._removeWaypoint', libRulerRemoveWaypoint, 'OVERRIDE');

  libWrapper.register(MODULE_ID, 'Ruler.prototype.toJSON', libRulerToJSON, 'WRAPPER');
  libWrapper.register(MODULE_ID, 'Ruler.prototype.update', libRulerUpdate, 'WRAPPER');

  libWrapper.register(MODULE_ID, 'Ruler.prototype._onMouseMove', libRulerOnMouseMove, 'OVERRIDE');

  log("registerRuler finished!");
}



// ---------------- FLAGS ------------- //
/*
 * Add getFlag method to Ruler class.
 */

Object.defineProperty(Ruler.prototype, "getFlag", {
  value: libRulerGetFlag,
  writable: true,
  configurable: true
});

/*
 * Add setFlag method  to Ruler class.
 */

Object.defineProperty(Ruler.prototype, "setFlag", {
  value: libRulerSetFlag,
  writable: true,
  configurable: true
});

/*
 * Add unsetFlag method to Ruler class.
 */

Object.defineProperty(Ruler.prototype, "unsetFlag", {
  value: libRulerUnsetFlag,
  writable: true,
  configurable: true
});

// ---------------- RULER.MEASURE ------------- //


/*
 * Add method setDestination for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "setDestination", {
  value: libRulerSetDestination,
  writable: true,
  configurable: true
});

// ---------------- RULER.MOVETOKEN ------------- //
/*
 * Add method testForCollision for Ruler.moveToken
 */
Object.defineProperty(Ruler.prototype, "testForCollision", {
  value: libRulerTestForCollision,
  writable: true,
  configurable: true
});

/*
 * Add method animateToken for Ruler.moveToken
 */
Object.defineProperty(Ruler.prototype, "animateToken", {
  value: libRulerAnimateToken,
  writable: true,
  configurable: true
});

// ---------------- RULER._onMouseMove ------------- //
/*
 * Add method scheduleMeasurement for Ruler._onMouseMove
 */
Object.defineProperty(Ruler.prototype, "scheduleMeasurement", {
  value: libRulerScheduleMeasurement,
  writable: true,
  configurable: true
});

/*
 * Add method deferMeasurement for Ruler._onMouseMove
 */
Object.defineProperty(Ruler.prototype, "deferMeasurement", {
  value: libRulerDeferMeasurement,
  writable: true,
  configurable: true
});

/*
 * Add method cancelScheduledMeasurement for Ruler._onMouseMove
 */
Object.defineProperty(Ruler.prototype, "cancelScheduledMeasurement", {
  value: libRulerCancelScheduledMeasurement,
  writable: true,
  configurable: true
});

/*
 * Add method doDeferredMeasurements for Ruler._onMouseMove
 * Used by Ruler.moveToken to check for any deferred activities before moving.
 */
Object.defineProperty(Ruler.prototype, "doDeferredMeasurements", {
  value: libRulerDoDeferredMeasurements,
  writable: true,
  configurable: true
});
