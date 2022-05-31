/* globals
game,
Hooks,
ui
*/
"use strict";

import { LibRulerSegment } from "./segment.js";
import { LibRuler } from "./ruler-class.js";
import { LibRulerUtilities } from "./utility.js";
import { DragRulerRuler, registerDragRulerMethods } from "./drag-ruler/drag-ruler-class.js";
import { DragRulerSegment } from "./drag-ruler/drag-ruler-segment-class.js";

export const MODULE_ID = "libruler";

/*
 * Logging function to replace console.log
 * @param ...args Args that are typically sent to console.log().
 * If either FORCE_DEBUG or the dev package is being used and set to debut,
 *   then output log. Prefix with MODULE_ID.
 * Otherwise, do nothing.
 */
export function log(...args) {
  try {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
    if (isDebugging) {
      console.log(MODULE_ID, "|", ...args);
    }
  } catch(e) {
    // Empty
  }
}

// https://discord.com/channels/732325252788387980/754127569246355477/819710580784234506
// init is called almost immediately after the page loads.
// At this point, the game global exists, but hasn't yet been initialized,
// but all of the core foundry code has been loaded.
Hooks.once("init", async function() {
  log(`Initializing libRuler. Drag Ruler active? ${game.modules.get("drag-ruler")?.active}`);

  const use_dr = game.modules.get("drag-ruler")?.active;

  let FoundryRuler = undefined;
  let DragRulerOriginal = undefined;
  if ( use_dr ) {
    DragRulerOriginal = Ruler;
    Ruler = DragRulerRuler;
    window.RulerSegment = DragRulerSegment;

  } else {
    FoundryRuler = Ruler;
    Ruler = LibRuler;
    window.RulerSegment = LibRulerSegment;
  }

  window.libRuler = {
    LibRuler,
    LibRulerSegment,
    LibRulerUtilities,
    FoundryRuler,
    DragRulerOriginal,
    DragRulerRuler,
    DragRulerSegment };

  use_dr && registerDragRulerMethods();

  // Tell modules that the libRuler library is set up
  Hooks.callAll("libRulerReady");
});

// https://github.com/League-of-Foundry-Developers/foundryvtt-devMode
Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});

// Hooks.once("dragRuler.ready", async function(speedProvider) {
//   Drag Ruler extends Ruler class and replaces it
//   Revert this.
//   dragRuler.DragRulerRuler = Ruler;
//   Ruler = DragRulerRuler;
//   window.RulerSegment = DragRulerSegment;
//
//   registerDragRulerMethods();
//
//   // Re-create rulers using new classes
//   // See ControlsLayer.prototype.drawRulers
//   canvas.controls.rulers.removeChildren();
//   canvas.controls.drawRulers();
// });