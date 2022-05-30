/* globals
game,
Hooks,
ui
*/
"use strict";

import { LibRulerSegment } from "./segment.js";
import { LibRuler } from "./ruler-class.js";
import { LibRulerUtilities } from "./utility.js";

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
  log("Initializing libRuler.");

  const FoundryRuler = Ruler;
  Ruler = LibRuler;
  window.RulerSegment = LibRulerSegment;

  window.libRuler = { LibRulerSegment, LibRulerUtilities, LibRuler, FoundryRuler };

  // Tell modules that the libRuler library is set up
  Hooks.callAll("libRulerReady");
});

// https://github.com/League-of-Foundry-Developers/foundryvtt-devMode
Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});
