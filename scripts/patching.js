import { MODULE_ID, log } from "./module.js";

import { libRulerMeasure,
         libRulerMeasureSetDestination,
         libRulerConstructSegmentDistanceRay,
         libRulerConstructSegmentHighlightRay,
         libRulerCheckCreatedSegments,
         libRulerDrawLineSegment,
         libRulerDrawDistanceSegmentLabel,
         libRulerDrawSegmentEndpoints,
         libRulerGetSegmentLabel
       } from "./ruler-measure.js";
       
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag,
         libRulerToJSON,
         libRulerUpdate
       } from "./ruler-flags.js";

export function registerLibRuler() {
  libWrapper.register(MODULE_ID, 'Ruler.prototype.measure', libRulerMeasure, 'OVERRIDE');
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
 * Add method setDestination for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "setDestination", {
  value: libRulerMeasureSetDestination,
  writable: true,
  configurable: true
});

/*
 * Add method constructSegmentDistanceRay for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "constructSegmentDistanceRay", {
  value: libRulerConstructSegmentDistanceRay,
  writable: true,
  configurable: true
});

/*
 * Add method constructSegmentHighlightRay for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "constructSegmentHighlightRay", {
  value: libRulerConstructSegmentHighlightRay,
  writable: true,
  configurable: true
});

/*
 * Add method checkCreatedSegments for Ruler.measure
 */
Object.defineProperty(Ruler.prototype, "checkCreatedSegments", {
  value: libRulerCheckCreatedSegments,
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

