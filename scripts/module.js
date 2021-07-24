import { registerLibRuler } from "./patching.js";
import { RulerSegment } from "./segment.js";
import { RulerUtilities } from "./utility.js";
import { libRulerToolBar } from "./libruler-controls-class.js";

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
  
  registerLibRuler();    
  
  window['libRuler'] = { RulerSegment: RulerSegment,
                         RulerUtilities: RulerUtilities };  
      
  // tell modules that the libRuler library is set up
  Hooks.callAll('libRulerReady');
});

// https://github.com/League-of-Foundry-Developers/foundryvtt-devMode
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});

Hooks.once('ready', async function() {
  if(game?.user?.isGM === undefined || game.user.isGM) {
    if(!game.modules.get('lib-wrapper')?.active) ui.notifications.error("Module Elevation Ruler requires the 'libWrapper' module. Please install and activate it.");
  }
});

// Set up the Ruler toolbar for modules to use

Hooks.on('renderSceneControls', (controls) => {
  log(controls);

  if(canvas != null) {
    if(controls.activeControl === "token") {
      if(controls.activeTool === "ruler") {
        canvas.controls.toolbar = new libRulerToolBar();
        canvas.controls.toolbar.render(true);
      } else {
        if(!canvas.controls.toolbar) return;
        canvas.controls.toolbar.close();
      }
    }
  }
  
});

// Hooks.on('renderlibRulerToolBar', () => {
// 	const tools = $(canvas.controls.toolbar.form).parent();
// 	if (!tools)
// 		return;
// 	const controltools = $('li[data-control="terrain"] ol.control-tools');
// 	const offset = controltools.offset();
// 	tools.css({ top: `${offset.top}px`, left: `${offset.left + controltools.width() + 6}px` });



