/* globals
RulerSegment
*/
"use strict";

import { log } from "./module.js";
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag
       } from "./ruler-flags.js";


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

LibRuler extends Ruler {


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
      log(`waypoints`, waypoints);

      const origin = waypoints[segment_num];
      const label = this.labels.children[segment_num];

      log(`RulerSegment ${segment_num}: ${origin.x}, ${origin.y} ⇿ ${dest.x}, ${dest.y}`);

      // ----- Construct the ray representing the segment on the canvas ---- //
      const s = new RulerSegment(origin, dest, this, prior_segment, segment_num, options);
      s.last = segment_num === (waypoints.length - 2);

      log(`RulerSegment ${segment_num}:`, s);

      // skip if not actually distant
      // Note: In the original code, label.visible also set to false but unclear why.
      //       The label is never used because the segment is never added to the segments array.
      // Also: should this be s.ray.distance or s.distance? In other words, the distance
      //       of the line on the canvas or the distance of the measured amount?
      //       Using ray.distance as in original for now.
      //       If using s.distance, need to multiply by canvas.scene.data.grid. Also, rounding may cause problems.
      // const original_ray = new Ray(origin, dest);
      //  log(`Ray distance: ${s.ray.distance}; RulerSegment distance: ${s.distance}; Original distance: ${original_ray.distance}`)
      if ( s.ray.distance < 10 ) {
        if ( label ) label.visible = false;
        s.drawEndpoints(); // draw the first waypoint regardless
        continue; // go to next segment
      }

      // add to array only if s.distance is greater or equal to 10
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
    remeasure && this.measure(point, options);
  }

  /

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