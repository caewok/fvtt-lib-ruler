import { log } from "./module.js";
import { Segment } from "./segment.js";


/* -------------------------------------------- */
/**
 * Measure the distance between two points and render the ruler UI to illustrate it
 * @param {PIXI.Point} destination  The destination point to which to measure
 * @param {boolean} gridSpaces      Restrict measurement only to grid spaces
 * (1) Set destination
 * (2) Construct segment rays for the visible ruler
 * (3) Compute measured distance
 * (4) Construct segment labels
 * (5) Draw path and endpoints
 * (6) Return segments
 */
export function libRulerMeasure(destination, {gridSpaces=true}={}) {
  log("We are measuring!", this);

/* 
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

	this.setDestination(destination);
	
	let waypoints = this.waypoints.concat([this.destination]);
	let r = this.ruler;
	
	// Clear the grid highlight layer
  // Unclear why this check is necessary; not needed in original.
  if(!canvas.grid.highlightLayers.hasOwnProperty(this.name)) {
    //log(`canvas.grid.highlightLayers does not include ${this.name}; adding.`);
    canvas.grid.addHighlightLayer(this.name);
  }

  //log("canvas.grid.highlightLayers", canvas.grid.highlightLayers); 
  const hlt = canvas.grid.highlightLayers[this.name];
  hlt.clear();  
	r.clear();
	
	// Iterate over waypoints to construct segment rays
	// Each ray represents the path of the ruler on the canvas
	// Each segment is then annotated with distance, text label, and indicator if last.
	// The ruler line, label, highlighted grid, and endpoint is then drawn
	let segments = [];
	for ( let [segment_num, dest] of waypoints.slice(1).entries() ) {
	  log(`waypoints`, waypoints);
          
		const origin = waypoints[segment_num];
		const label = this.labels.children[segment_num];
		
		log(`Segment ${segment_num}: ${origin.x}, ${origin.y} ⇿ ${dest.x}, ${dest.y}`);

    // ----- Construct the ray representing the segment on the canvas ---- //
    const s = new Segment(origin, dest, this, segments, segment_num, { gridSpaces: gridSpaces });
    s.last = segment_num === (waypoints.length - 2);
    
		log(`Segment ${segment_num}:`, s);
    		
		// skip if not actually distant
		// Note: In the original code, label.visible also set to false but unclear why.
		//       The label is never used because the segment is never added to the segments array.
		// Also: should this be s.ray.distance or s.distance? In other words, the distance
		//       of the line on the canvas or the distance of the measured amount? 
		//       Using ray.distance as in original for now.
		//       If using s.distance, need to multiply by canvas.scene.data.grid. Also, rounding may cause problems. 
		const original_ray = new Ray(origin, dest);
		//	log(`Ray distance: ${s.ray.distance}; Segment distance: ${s.distance}; Original distance: ${original_ray.distance}`)
		if ( s.ray.distance < 10 ) {
			if ( label ) label.visible = false;
			s.drawEndpoints(); // draw the first waypoint regardless
			continue; // go to next segment
		}
		
		// add to array only if s.distance is greater or equal to 10     		
		segments.push(s);
		
		log(`Segment ${segment_num}: distance ${s.distance}; text ${s.text}; last? ${s.last}. Total distance: ${s.totalDistance}.`);
    		
		
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
	return segments;
}

/*
 * For method Ruler.setDestination
 * Sets destination used when moving the token.
 *
 * @param {PIXI.Point} destination  The destination point to which to measure
 */
export function libRulerSetDestination(destination) {
  destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
  this.destination = destination;
}


/* 
 * Override _highlightMeasurement to catch modules that are
 * inadvertently overriding rather than using Segment.highlightMeasurement.
 */
export function libRulerHighlightMeasurement(wrapped, ...args) {
  if(game.user.isGM) {
    ui.notifications.warn("A module or other code is calling Ruler._highlightMeasurement, which has been deprecated by libRuler. This may cause unanticipated results.");
  }
  
  return wrapped(...args);
}

