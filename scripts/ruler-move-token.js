/* globals
game,
ui,
canvas,
Ruler,
Ray,
duplicate,
isNewerVersion,
CanvasAnimation
*/
 
'use strict';


import { log } from "./module.js";

// Subset Ruler.moveToken method

/* -------------------------------------------- */
/**
 * Determine whether a SPACE keypress event entails a legal token movement along a measured ruler.
 *
 * @return {Promise<boolean>} An indicator for whether a token was successfully moved or not. If True the event should be prevented from propagating further, if False it should move on to other handlers.
 *
 * Subset functionality:
 * (1) collision test to permit the movement
 * (2) animating the token movement 
 */
export async function libRulerMoveToken() {
    let wasPaused = game.paused;
    if ( wasPaused && !game.user.isGM ) {
      ui.notifications.warn("GAME.PausedWarning", {localize: true});
      return false;
    }
    if ( !this.visible || !this.destination ) return false;
    const token = this._getMovementToken();
    if ( !token ) return false;
    log("token", token);
    
    // Wait until all scheduled measurements or other activities are done (non in default)
    await this.doDeferredMeasurements;
    
    // Determine offset relative to the Token top-left.
    // This is important so we can position the token relative to the ruler origin for non-1x1 tokens.
    const origin = canvas.grid.getTopLeft(this.waypoints[0].x, this.waypoints[0].y);
    const s2 = canvas.dimensions.size / 2;
    const dx = Math.round((token.data.x - origin[0]) / s2) * s2;
    const dy = Math.round((token.data.y - origin[1]) / s2) * s2;

    
    // Get the movement rays and check collision along each Ray
    // These rays are center-to-center for the purposes of collision checking
    const rays = this._getRaysFromWaypoints(this.waypoints, this.destination);
    const hasCollision = this.testForCollision(rays);    
    if ( hasCollision ) {
      ui.notifications.error("ERROR.TokenCollide", {localize: true});
      return false;
    }
    // Execute the movement path defined by each ray.
    this._state = Ruler.STATES.MOVING;
    let priorDest = undefined;
    
    for ( let [i, r] of rays.entries() ) {
    
      // Break the movement if the game is paused
      if ( !wasPaused && game.paused ) break;
      
      // Break the movement if Token is no longer located at the prior destination (some other change override this)
      if ( priorDest && ((token.data.x !== priorDest.x) || (token.data.y !== priorDest.y)) ) break;

      priorDest = await this.animateToken(token, r, dx, dy, i + 1); // increment by 1 b/c first segment is 1.
    }   
    // Once all animations are complete we can clear the ruler
    this._endMeasurement();
}

/* 
 * For method testForCollision
 *
 * When moving a token along a rule, this method checks for collisions
 *
 * @param {Ray[]} rays An Array of Ray objects which represent the segemnts of the waypoint path.
 * @return {boolean} true if a collision will occur
 */
export function libRulerTestForCollision(rays) {
  return rays.some(r => canvas.walls.checkCollision(r));
}

/*
 * For method animateToken
 *
 * This method moves the token along the ruler.
 *
 * @param {Token} token The token that is being animated.
 * @param {Ray} ray The ray indicating the segment that should be moved.
 * @param {number} dx Offset in x direction relative to the Token top-left.
 * @param {number} dy Offset in y direction relative to the Token top-left.
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 * @return {x: Number, y: Number} Return the prior destination (path.B) 
 */
export async function libRulerAnimateToken(token, ray, dx, dy, segment_num) {
  log(`Animating token for segment_num ${segment_num}`);
  
  // Adjust the ray based on token size
  const dest = canvas.grid.getTopLeft(ray.B.x, ray.B.y);
  const path = new Ray({x: token.data.x, y: token.data.y}, {x: dest[0] + dx, y: dest[1] + dy});
  
  // Commit the movement and update the final resolved destination coordinates
  const priorDest = duplicate(path.B); // resolve issue #3; get prior dest before update.
  await token.document.update(path.B);
  path.B.x = token.data.x;
  path.B.y = token.data.y;
    
  // Retrieve the movement animation and await its completion
  // v.9.231+ only
  if(isNewerVersion(game.version, '9.230')) {
    const anim = CanvasAnimation.getAnimation(token.movementAnimationName);
    if ( anim?.promise ) await anim.promise;
  } else {
    // Update the path which may have changed during the update, and animate it
    await token.animateMovement(path);
  }
  
  return priorDest;
}