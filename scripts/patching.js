import { MODULE_ID, log } from "./module.js";

import { libRulerMeasure,
         libRulerSumSegmentDistances,
         libRulerSetDestination,
         libRulerSetSegmentProperties,
         libRulerMeasureDistance,
         libRulerConstructSegmentRay,
         libRulerDrawLineSegment,
         libRulerDrawDistanceSegmentLabel,
         libRulerDrawSegmentEndpoints,
         libRulerGetSegmentLabel,
         
         libRulerHighlightMeasurement,
         libRulerGetColor,
         libRulerHighlightPosition
       } from "./ruler-measure.js";
       
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag,
         libRulerToJSON,
         libRulerUpdate
       } from "./ruler-flags.js";
       
import { libRulerMoveToken,
         libRulerTestForCollision,
         libRulerAnimateToken 
       } from "./ruler-move-token.js";

export function registerLibRuler() {
  libWrapper.register(MODULE_ID, 'Ruler.prototype.measure', libRulerMeasure, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype.moveToken', libRulerMoveToken, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype._highlightMeasurement', libRulerHighlightMeasurement, 'OVERRIDE');
  
  libWrapper.register(MODULE_ID, 'Ruler.prototype.toJSON', libRulerToJSON, 'WRAPPER');
  libWrapper.register(MODULE_ID, 'Ruler.prototype.update', libRulerUpdate, 'WRAPPER');

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
 * Helper function sumSegmentDistances for easily totaling distances in Ruler.measure segments.
 */
Object.defineProperty(Ruler.prototype, "sumSegmentDistances", {
  value: libRulerSumSegmentDistances,
  writable: true,
  configurable: true
});

/*
 * Add method setDestination for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "setDestination", {
  value: libRulerSetDestination,
  writable: true,
  configurable: true
});

/*
 * Add method setDestination for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "setSegmentProperties", {
  value: libRulerSetSegmentProperties,
  writable: true,
  configurable: true
});


/*
 * Add method measureDistance for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "measureDistance", {
  value: libRulerMeasureDistance,
  writable: true,
  configurable: true
});


/*
 * Add method constructSegmentHighlightRay for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "constructSegmentRay", {
  value: libRulerConstructSegmentHighlightRay,
  writable: true,
  configurable: true
});



/*
 * Add method drawLineSegment for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "drawLineSegment", {
  value: libRulerDrawLineSegment,
  writable: true,
  configurable: true
});

/*
 * Add method drawDistanceSegmentLabel for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "drawDistanceSegmentLabel", {
  value: libRulerDrawDistanceSegmentLabel,
  writable: true,
  configurable: true
});

/*
 * Add method drawSegmentEndpoints for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "drawSegmentEndpoints", {
  value: libRulerDrawSegmentEndpoints,
  writable: true,
  configurable: true
});

/*
 * Add method getSegmentLabel for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "getSegmentLabel", {
  value: libRulerGetSegmentLabel,
  writable: true,
  configurable: true
});

// ---------------- RULER._HIGHLIGHTMEASUREMENT ------------- // 
/*
 * Add method getColor for Ruler._highlightMeasurement
 */
Object.defineProperty(Ruler.prototype, "getColor", {
  value: libRulerGetColor,
  writable: true,
  configurable: true
});

/*
 * Add method highlightPosition for Ruler._highlightMeasurement
 */
Object.defineProperty(Ruler.prototype, "highlightPosition", {
  value: libRulerHighlightPosition,
  writable: true,
  configurable: true
});

// ---------------- RULER.MOVETOKEN ------------- // 
/*
 * Add method testForCollision for Ruler.moveToke
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

