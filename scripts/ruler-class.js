/* globals
RulerSegment,
Ruler,
canvas,
PIXI,
PreciseText,
CONFIG,
ui,
game,
Ray,
duplicate,
CanvasAnimation,
isNewerVersion
*/
"use strict";

import { log } from "./module.js";
import {
  libRulerGetFlag,
  libRulerSetFlag,
  libRulerUnsetFlag } from "./ruler-flags.js";


/*
Extend and override the Ruler class.
The original measure code seems inefficient b/c it:
  1. loops over each waypoint
  2. measures the resulting segments, which requires looping over each segment.
  3. loops over the resulting distances
  4. loops over the segments to draw them
  5. loops over the waypoints to draw endpoints

canvas.grid.measureDistances uses map over the segments in the default,
as does the overwritten dnd5e version. I know of no method that requires
knowing all the segments in advance. It seems unlikely, because a segment is
conceptually discrete and determined by the user on the fly.

For a ruler, knowing the prior segments may be important to determine distance to
date, but knowing the end segments is less likely to matter. Keep in mind that the
ruler always starts with a single segment, and is built up or destroyed by the user;
we never really know at this stage what the final destination is.

So this code has been revised to rely on a single loop. Each segment is built up in
that loop, and sub-functions are told what segment number we are on and are provided
the segments built thus far. Beside that information, sub-functions have access to the
ruler object (via this) and can access the original waypoints array and any module flags.
*/

export class LibRuler extends Ruler {

  /**
   * @override
   * Measure the distance between two points and render the ruler UI to illustrate it
   * @param {PIXI.Point} destination  The destination point to which to measure
   * @param {Object} options          Optional arguments passed to each ruler segment.
   *                                  If not provided, options.gridSpaces will be set to
   *                                  true for consistency with Ruler.measure.
   * @param {boolean} options.gridSpaces      Restrict measurement only to grid spaces
   */
  measure(destination, options) {
    log("We are measuring!", this);

    options.gridSpaces ??= true;

    this.setDestination(destination);

    let waypoints = this.waypoints.concat([this.destination]);
    let r = this.ruler;

    // Clear the grid highlight layer
    const hlt = canvas.grid.highlightLayers[this.name] || canvas.grid.addHighlightLayer(this.name);
    hlt.clear();
    r.clear();

    // Iterate over waypoints to construct segment rays
    // Each ray represents the path of the ruler on the canvas
    // Each segment is then annotated with distance, text label, and indicator if last.
    // The ruler line, label, highlighted grid, and endpoint is then drawn
    let prior_segment = {};
    for ( let [segment_num, dest] of waypoints.slice(1).entries() ) {
      log("waypoints", waypoints);

      const origin = waypoints[segment_num];
      const label = this.labels.children[segment_num];

      log(`RulerSegment ${segment_num}: ${origin.x}, ${origin.y} ⇿ ${dest.x}, ${dest.y}`);

      // ----- Construct the ray representing the segment on the canvas ---- //
      const s = new RulerSegment(origin, dest, this, prior_segment, segment_num, options);
      s.last = segment_num === (waypoints.length - 2);

      log(`RulerSegment ${segment_num}:`, s);

      // Skip if not actually distant
      // Note: In the original code, label.visible also set to false but unclear why.
      //       The label is never used because the segment is never added to the segments array.
      // Also: should this be s.ray.distance or s.distance? In other words, the distance
      //       of the line on the canvas or the distance of the measured amount?
      //       Using ray.distance as in original for now.
      //       If using s.distance, need to multiply by canvas.scene.data.grid. Also, rounding may cause problems.
      // const original_ray = new Ray(origin, dest);
      //  log(`Ray distance: ${s.ray.distance};
      //    RulerSegment distance: ${s.distance}; Original distance: ${original_ray.distance}`)
      if ( s.ray.distance < 10 ) {
        if ( label ) label.visible = false;
        s.drawEndpoints(); // Draw the first waypoint regardless
        continue; // Go to next segment
      }

      // Add to array only if s.distance is greater or equal to 10
      prior_segment = s;

      log(`RulerSegment ${segment_num}: distance ${s.distance}; text ${s.text}; last? ${s.last}. Total distance: ${s.totalDistance}.`);


      // ----- Draw the Ruler Segment ---- //
      //
      s.drawLine();

      // Draw the distance label just after the endpoint of the segment
      s.drawDistanceLabel();

      // Highlight grid positions
      s.highlightMeasurement();

      // Draw endpoint
      s.drawEndpoints();
    }

    // Return the measured segments
    // for consistency with default code, may want to modify segment to be an array;
    // make each prior_segment one of the array items.
    return prior_segment;
  }

  clear() {
    this.cancelScheduledMeasurement();
    super.clear();
  }

  /**
   * Set the destination used when measuring, as the grid center of the passed value.
   * @type {Point}   The destination point to which to measure.
   */
  setDestination(value) {
    value && (this.destination = new PIXI.Point(...canvas.grid.getCenter(value.x, value.y)));
  }

  /**
   * @override
   * Allow other modules to pass points and determine whether to center them first.
   * @param {Point} point    Waypoint location on the grid
   * @param {Boolean} center      If true, center the point on the grid first.
   */
  _addWaypoint(point, center = true) {
    const waypoint = center ? canvas.grid.getCenter(point.x, point.y) : [point.x, point.y];

    this.waypoints.push(new PIXI.Point(waypoint[0], waypoint[1]));
    this.labels.addChild(new PreciseText("", CONFIG.canvasTextStyle));
  }

  /**
   * @override
   * Allow modules to avoid re-measuring after removing a waypoint.
   * This may be useful if a module is setting waypoints automatically (e.g., pathfinding).
   * In such cases, the module would be responsible for ensuring measurement still happens eventually.
   * @param {Point} point
   * @param {Object} options  Options passed to Ruler.measure if options.remeasure is true.
   * Options:
   * @param {Boolean} remeasure   If true, will trigger a measure after removing waypoint.
   */
  _removeWaypoint(point, options) {
    const remeasure = options.remeasure || true;
    this.waypoints.pop();
    this.labels.removeChild(this.labels.children.pop());
    remeasure && this.measure(point, options); // eslint-disable-line no-unused-expressions
  }

 /**
  * New method to wipe waypoints all at once; no re-measuring.
  * Used by DragRuler but added here in case other methods need to
  * do something before destroying waypoints.
  */
  _clearWaypoints() {
    this.waypoints.length = 0;
    this.labels.removeChildren().forEach(c => c.destroy());
  }

  // MOVING TOKENS
  /**
   * @override
   * Subset functionality:
   * (1) collision test to permit the movement
   * (2) animating the token movement
   * Determine whether a SPACE keypress event entails a legal token movement along a measured ruler
   *
   * @return {Promise<boolean>}    An indicator for whether a token was successfully moved or not.
   *                               If True the event should be prevented from propagating further.
   *                               If False it should move on to other handlers.
   */
  async moveToken() {
    // Initial tests to see if the token can be moved.

    const wasPaused = game.paused;
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

    const { dx, dy } = this.calculateMoveTokenOffset(token);

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

      priorDest = await this.animateToken(token, r, dx, dy, i + 1); // Increment by 1 b/c first segment is 1.
    }
    // Once all animations are complete we can clear the ruler
    this._endMeasurement();

  }

  /**
   * Determine offset relative to the Token top-left.
   * This is important so we can position the token relative to the ruler origin for non-1x1 tokens.
   * @token {Token} token   Token to be moved
   * @return {dx, dy} Change in x and y amounts compared to token.data.x, token.data.y
   */
  calculateMoveTokenOffset(token) {
    const origin = canvas.grid.getTopLeft(this.waypoints[0].x, this.waypoints[0].y);
    const s2 = canvas.dimensions.size / 2;
    const dx = Math.round((token.data.x - origin[0]) / s2) * s2;
    const dy = Math.round((token.data.y - origin[1]) / s2) * s2;
    return { dx, dy };
  }

  /**
   * When moving a token along a rule, this method checks for collisions.
   * @param {Ray[]} rays An Array of Ray objects which represent the segemnts of the waypoint path.
   * @return {boolean} true if a collision will occur
   */
  testForCollision(rays) { return rays.some(r => canvas.walls.checkCollision(r)); }

  /**
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
  async animateToken(token, ray, dx, dy, segment_num) {
    log(`Animating token for segment_num ${segment_num}`);

    // Adjust the ray based on token size
    const dest = canvas.grid.getTopLeft(ray.B.x, ray.B.y);
    const path = new Ray({x: token.data.x, y: token.data.y}, {x: dest[0] + dx, y: dest[1] + dy});

    // Commit the movement and update the final resolved destination coordinates
    const priorDest = duplicate(path.B); // Resolve issue #3; get prior dest before update.
    await token.document.update(path.B);
    path.B.x = token.data.x;
    path.B.y = token.data.y;

    // Retrieve the movement animation and await its completion
    // v.9.231+ only
    if ( isNewerVersion(game.version, "9.230") ) {
      const anim = CanvasAnimation.getAnimation(token.movementAnimationName);
      if ( anim?.promise ) await anim.promise;
    } else {
      // Update the path which may have changed during the update, and animate it
      await token.animateMovement(path);
    }

    return priorDest;
  }

  /**
   * @override
   * Add scheduled and deferred measurements.
   * Used by drag ruler.
   * Continue a Ruler measurement workflow for left-mouse movements on the Canvas.
   */
  _onMouseMove(event) {
    if ( this._state === Ruler.STATES.MOVING ) return;

    // Extract event data
    const { origin, destination } = event.data;

    // Do not begin measuring unless we have moved at least 1/4 of a grid space
    const dx = destination.x - origin.x;
    const dy = destination.y - origin.y;
    const distance = Math.hypot(dy, dx);
    if ( !this.waypoints.length && (distance < (canvas.dimensions.size / 4))) return;

    // Hide any existing Token HUD
    canvas.hud.token.clear();
    delete event.data.hudState;

    this.scheduleMeasurement(destination, event);
  }

  /**
   * Schedule a measurement.
   */
  scheduleMeasurement(destination, event, measurementInterval = 50) { // eslint-disable-line no-unused-vars
    const mt = event._measureTime || 0;
    const originalEvent = event.data.originalEvent;
    if (Date.now() - mt > measurementInterval) {
      this.measure(destination, {snap: !originalEvent.shiftKey});
      event._measureTime = Date.now();
      this._state = Ruler.STATES.MEASURING;
      this.cancelScheduledMeasurement();
    } else {
      this.deferMeasurement(destination, event);
    }
  }

  /**
   * Defer a measurement. Default: do nothing.
   */
  deferMeasurement(destination, event) { } // eslint-disable-line no-unused-vars

  /**
   * Cancel a scheduled measurement.
   */
  cancelScheduledMeasurement() { }

  /**
   * Do any deferred measurement.
   */
  async doDeferredMeasurements() { return Promise.resolve(true); }

  /**
   * @typedef {object} RulerData
   * @property {number} _state           The ruler measurement state.
   * @property {string} name             A unique name for the ruler containing the owning user's ID.
   * @property {PIXI.Point} destination  The current point the ruler has been extended to.
   * @property {string} class            The class name of this ruler instance.
   * @property {PIXI.Point[]} waypoints  Additional waypoints along the ruler's length, including the starting point.
   * @property {object} flags            Flags stored by modules
   */

  /**
   * @wrap
   * Save any flags with the JSON.
   * @returns {RulerData}
   */
  toJSON() {
    log("Creating JSON!", this);
    const obj = super.toJSON();
    obj.flags = this.flags;
    return obj;
  }

  /**
   * @wrap
   * Update flags when updating the ruler
   * @param {Object} data   Ruler data with which to update the display
   */
  update(data) {
    log("We are updating!", this);

    this.flags = data.flags;
    return super.update(data);
  }

  // DEPRECATED METHODS
  /**
   * @deprecated
   */
  _highlightMeasurement(...args) {
    if ( game.user.isGM ) {
      ui.notifications.warn("A module or other code is calling Ruler._highlightMeasurement, which has been deprecated by libRuler. This may cause unanticipated results. Modules should use RulerSegment.highlightMeasurement instead");
    }
    super._highlightMeasurement(...args);
  }
}

// ---------------- FLAGS ------------- //
Object.defineProperty(LibRuler.prototype, "getFlag", {
  value: libRulerGetFlag,
  writable: true,
  configurable: true
});

Object.defineProperty(LibRuler.prototype, "setFlag", {
  value: libRulerSetFlag,
  writable: true,
  configurable: true
});

Object.defineProperty(LibRuler.prototype, "unsetFlag", {
  value: libRulerUnsetFlag,
  writable: true,
  configurable: true
});
