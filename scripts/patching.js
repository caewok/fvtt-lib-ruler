import { MODULE_ID, log } from "./module.js";

import { libRulerMeasure,  
         
         libRulerSetDestination       
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
       
import { Segment } from "./segment.js";

export function registerLibRuler() {
  libWrapper.register(MODULE_ID, 'Ruler.prototype.measure', libRulerMeasure, 'OVERRIDE');
  libWrapper.register(MODULE_ID, 'Ruler.prototype.moveToken', libRulerMoveToken, 'OVERRIDE');  
  libWrapper.register(MODULE_ID, 'Ruler.prototype._highlightMeasurement', Segment.prototype.highlightMeasurement, 'OVERRIDE');
  
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
  value: libRulerSetDestination,
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

