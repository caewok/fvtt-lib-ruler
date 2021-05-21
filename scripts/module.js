export const MODULE_ID = 'lib-ruler';
const FORCE_DEBUG = true; // used for logging before dev mode is set up

/* 
 * Logging function to replace console.log
 * @param ...args Args that are typically sent to console.log(). 
 * If either FORCE_DEBUG or the dev package is being used and set to debut, 
 *   then output log. Prefix with MODULE_ID.
 * Otherwise, do nothing.
 */
export function log(...args) {
  try {
    const isDebugging = window.DEV?.getPackageDebugValue(CONSTANTS.MODULE_ID);
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
		log(`Is lib-wrapper available? ${game.modules.get('lib-wrapper')?.active}`);

});

// setup is after init; before ready. 
// setup is called after settings and localization have been initialized, 
// but before entities, packs, UI, canvas, etc. has been initialized
Hooks.once('setup', async function() {
		log("libRuler ready.");
		log(`Is lib-wrapper available? ${game.modules.get('lib-wrapper')?.active}`);
});

// modules ready
// ready is called once everything is loaded up and ready to go.
Hooks.once('ready', async function() {
		log("libRuler ready.");
		log(`Is lib-wrapper available? ${game.modules.get('lib-wrapper')?.active}`);
});
