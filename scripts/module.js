import { registerLibRuler } from "./patching.js";
import { Segment } from "./segment.js";

export const MODULE_ID = 'libruler';
const FORCE_DEBUG = false; // used for logging before dev mode is set up

/* 
 * Logging function to replace console.log
 * @param ...args Args that are typically sent to console.log(). 
 * If either FORCE_DEBUG or the dev package is being used and set to debut, 
 *   then output log. Prefix with MODULE_ID.
 * Otherwise, do nothing.
 */
export function log(...args) {
  try {
    const isDebugging = window.DEV?.getPackageDebugValue(MODULE_ID);
    //console.log(MODULE_ID, '|', `isDebugging: ${isDebugging}.`);

    if (FORCE_DEBUG || isDebugging) {
      console.log(MODULE_ID, '|', ...args);
    }
  } catch (e) {}
}

// https://discord.com/channels/732325252788387980/754127569246355477/819710580784234506
// init is called almost immediately after the page loads. 
// At this point, the game global exists, but hasn't yet been initialized, 
// but all of the core foundry code has been loaded.
Hooks.once('init', async function() {
  log("Initializing libRuler.");
  if(!game.modules.get('lib-wrapper')?.active && game.user.isGM) ui.notifications.error("Module Elevation Ruler requires the 'libWrapper' module. Please install and activate it.");
  registerLibRuler();    
  
  window['libRuler'] = { Segment: Segment };
      
  // tell modules that the libRuler library is set up
  Hooks.callAll('libRulerReady');
});

// https://github.com/League-of-Foundry-Developers/foundryvtt-devMode
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});
