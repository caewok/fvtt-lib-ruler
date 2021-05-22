import { MODULE_ID, log } from "./module.js";
import { libRulerMeasure } from "./ruler-measure.js";
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag
       } from "./ruler-flags.js";

export function registerRuler() {
  libWrapper.register(MODULE_ID, 'Ruler.prototype.measure', libRulerMeasure, 'OVERRIDE');  
  log("registerRuler finished!");
}

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