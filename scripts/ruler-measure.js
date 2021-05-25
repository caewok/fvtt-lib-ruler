import { log } from "./module.js";


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
    log(`canvas.grid.highlightLayers does not include ${this.name}; adding.`);
    canvas.grid.addHighlightLayer(this.name);
  }

  log("canvas.grid.highlightLayers", canvas.grid.highlightLayers); 
  const hlt = canvas.grid.highlightLayers[this.name];
  hlt.clear();  
	r.clear();
	
	// Iterate over waypoints to construct segment rays
	// Each ray represents the path of the ruler on the canvas
	// Each segment is then annotated with distance, text label, and indicator if last.
	// The ruler line, label, highlighted grid, and endpoint is then drawn
	let segments = [];
	let totalDistance = 0;
	for ( let [segment_num, dest] of waypoints.slice(1).entries() ) {
	  log(`Segment ${segment_num} with dest`, dest);
	  log(`waypoints`, waypoints);
          

		const origin = waypoints[segment_num];
		const label = this.labels.children[segment_num];

    // ----- Construct the ray representing the segment on the canvas ---- //
		const ray = this.constructSegmentRay(origin, dest, segments, segment_num);
				
		// skip if not actually distant
		if ( ray.distance < 10 ) {
			if ( label ) label.visible = false;
			continue;
		}
		
		segments.push({ ray, label });
		log("Segments", segments);
		
		// ----- Label the segment with distance and text ----- //
		// will this permit modifying segments in the array?
		const s = segments[segment_num];
		s.last = segment_num === (waypoints.length - 2);
		s.idx = segment_num	
		s.flags = {};	
		s = this.addSegmentProperties(s, segments);
		
		s.distance = this.measureDistance(s, {gridSpaces}, segments);
		s.text = this.getSegmentLabel(s, totalDistance, segments);
		totalDistance += s.distance;
		

		log(`Segment ${segment_num}: distance ${s.distance}; text ${s.text}; last? ${s.last}. 
		     Segment array: ${segments[segment_num].distance}; ${segments[segment_num].text}; ${segments[segment_num].last}.
		     Total distance: ${totalDistance}.`, segments);
		     
		log(`totalDistance: ${totalDistance}; calculated: ${this.sumSegmentDistances(segments)}`);
		
		// ----- Draw the Ruler Segment ---- //
		// 
		this.drawLineSegment(s, segments);
		
		// Draw the distance label just after the endpoint of the segment
		this.drawDistanceSegmentLabel(s, segments);
		
		// Highlight grid positions
		this._highlightMeasurement(s, segments);
		
		// Draw endpoint
    log(`Waypoint ${segment_num}: ${waypoints[segment_num].x}, ${waypoints[segment_num].y}`, waypoints);
		this.drawSegmentEndpoints(waypoints[segment_num], segments, segment_num);
		
		// draw last endpoint at the destination
		if(s.last) this.drawSegmentEndpoints(waypoints[waypoints.length - 1], segments, segment_num)
	}
	
	// Return the measured segments
	return segments;
}

/*
 * Helper function to easily sum segment distances
 * 
 */
export function libRulerSumSegmentDistances(segments) {
  return segments.reduce((acc, curr) => acc + curr.distance, 0);
}

/*
 * For method Ruler.setDestination
 *
 * @param {PIXI.Point} destination  The destination point to which to measure
 */
export function libRulerSetDestination(destination) {
  destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
  this.destination = destination;
}

/*
 * For method Ruler.setSegmentProperties
 *
 * This method lets you store properties in the segment object before measuring distance,
 *   creating labels, or drawing the segment. Do not override lightly; wrapping is preferred.
 *
 * Preferably, add flags using the flag methods. For example:
 *   this.libRulerSetFlag.call(segment, scope, key, value) 
 * 
 *
 * @param {object} segment Represents the ruler path on the canvas between two waypoints.
 *    Segment has (at least) ray, last, and idx.
 * @param {object[]} segments An Array of measured ruler segments. 
 * @return {object} The segment, with properties added. 
 */
export function libRulerSetSegmentProperties(segment, segments) {
  // this.libRulerSetFlag.call(segment, scope, key, value) 
  return segment;
}


/*
 * For method Ruler.measureDistance
 *
 * This measurement indicates how much "distance" it costs to cover the segment.
 * The returned value may or may not be equivalent to the length of the segment.
 * @param {object} segment Represents the ruler path on the canvas between two waypoints.
 *    Segment has (at least) ray, last, and idx.
 * @param {object[]} segments An Array of measured ruler segments.
 * @return {numeric} The measured distance represented by the segment.
 */
export function libRulerMeasureDistance(segment, {gridSpaces=true}={}, segments) {
  log(`Measure distance for segment ${segment.idx}.`, segment);
  return canvas.grid.measureDistances([segment], {gridSpaces: gridSpaces})[0];
}

/* 
 * For method constructSegmentHighlightRay
 *
 * Ray used to represent the highlighted, or apparent, path traveled 
 *   between origin and destination.
 * Default: straight line between the origin and destination.
 * But the ray created not necessarily equal to the straight line between.
 * 
 * @param {PIXI.Point} origin Where the segment starts on the canvas.
 * @param {PIXI.Point} dest PIXI.Point Where the segment ends on the canvas
 * @param {object[]} segments An Array of measured ruler segments.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerConstructSegmentRay(origin, dest, segments, segment_num) {
	return new Ray(origin, dest);
}


/* 
 * For method drawLineSegment
 *
 * Takes a segment and draws the highlighted measure line on the canvas.
 * @param {object} segment The current segment for which to draw. 
 *    Segment has ray, distance, label, last, and idx.
 *    idx is the segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @param {object[]} segments An Array of measured ruler segments.
 */
export function libRulerDrawLineSegment(segment, segments) {
  const ray = segment.ray;
  
  this.ruler.lineStyle(6, 0x000000, 0.5).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y)
		 .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y);
}

/* 
 * For method drawDistanceSegmentLabel
 *
 * Draws the highlighted measure line on the canvas.
 * @param {object} segment The current segment for which to draw. 
 *    Segment has ray, distance, label, last, and idx.
 *    idx is the segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @param {object[]} segments An Array of measured ruler segments.

 */
export function libRulerDrawDistanceSegmentLabel(segment, segments) {
  const label = segment.label;
  const text = segment.text;
  const ray = segment.ray;
  const last = segment.last;
	
  if ( label ) {
			label.text = text;
			label.alpha = last ? 1.0 : 0.5;
			label.visible = true;
			let labelPosition = ray.project((ray.distance + 50) / ray.distance);
			label.position.set(labelPosition.x, labelPosition.y);
		}
	return label;	// in case another function wants to modify the label.
}

/* 
 * For method drawSegmentEndpoints
 *
 * Draws the end point indicators for each segment
 * @param {Object} waypoint Waypoint 
 * @param {object[]} segments An Array of measured ruler segments.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerDrawSegmentEndpoints(waypoint, segments, segment_num) {
  log(`Waypoint`, waypoint);
  this.ruler.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(waypoint.x, waypoint.y, 8);
}

/*
 * For method getSegmentLabel
 * 
 * Adds an index number for other modules to reference as necessary
 * For default, calls _getSegmentLabel() as in the base code.
 * 
 * waypoint_num is not used in the default implementation.
 * 
 * @param {object} segment The current segment for which to draw. 
 *    Segment has ray, distance, label, last, and idx.
 *    idx is the segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @param {number} totalDistance
 * @param {boolean} isTotal
 * @return {string} Text label displayed in the rule to indicate distance traveled.
 */
export function libRulerGetSegmentLabel(segment, totalDistance, segments) {
  const d = segment.distance;
  const is_total = segment.last; 

  return this._getSegmentLabel(d, totalDistance, is_total);
}


/* 
 * For method highlightMeasurement
 *
 * Expanded version of _highlightMeasurement.
 * @param {object} segment The current segment for which to draw. 
 *    Segment has ray, distance, label, last, and idx.
 *    idx is the segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @param {object[]} segments An Array of measured ruler segments.
 */
export function libRulerHighlightMeasurement(segment, segments) {
  const ray = segment.ray;
  const segment_num = segment.idx;
  
	const spacer = canvas.scene.data.gridType === CONST.GRID_TYPES.SQUARE ? 1.41 : 1;
	const nMax = Math.max(Math.floor(ray.distance / (spacer * Math.min(canvas.grid.w, canvas.grid.h))), 1);
	const tMax = Array.fromRange(nMax+1).map(t => t / nMax);
	
	// Track prior position
	let prior = null;
	
	// Iterate over ray portions
	for ( let [i, t] of tMax.entries() ) {
    log(`iterating over ray portion ${i}.`);
		let {x, y} = ray.project(t);
		
		// Get grid position
		let [x0, y0] = (i === 0) ? [null, null] : prior;
		let [x1, y1] = canvas.grid.grid.getGridPositionFromPixels(x, y);
		if ( x0 === x1 && y0 === y1 ) continue;
		
		// Highlight the grid position
		let [xg, yg] = canvas.grid.grid.getPixelsFromGridPosition(x1, y1);
		const color = this.getColor({x: xg, y: yg}, segments, segment_num);
		log(`Color: ${color} at x,y ${xg}, ${yg}`, color);
    this.highlightPosition({x: xg, y: yg}, color, segments, segment_num);
				
		// Skip the first one
		prior = [x1, y1];
		if ( i === 0 ) continue;
		
		// If the positions are not neighbors, also highlight their halfway point
		if ( !canvas.grid.isNeighbor(x0, y0, x1, y1) ) {
			let th = tMax[i - 1] + (0.5 / nMax);
			let {x, y} = ray.project(th);
			let [x1h, y1h] = canvas.grid.grid.getGridPositionFromPixels(x, y);
			let [xgh, ygh] = canvas.grid.grid.getPixelsFromGridPosition(x1h, y1h);
			
			const color = this.getColor({x: xgh, y: ygh}, segments, segment_num);
			log(`Color: ${color} at x,y ${xgh}, ${ygh}`, color);
			this.highlightPosition({x: xgh, y: ygh}, color, segments, segment_num)
		}
	}
  log("Finished libRulerHighlightMeasurement.");
}

/*
 * For a given position, return the color for the ruler highlight.
 * @param {Object} position Object with x and y indicating the pixels at the grid position.
 * @param {object[]} segments An Array of measured ruler segments.
 *    Each segment has ray, distance, label, last, and idx.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerGetColor(position, segments, segment_num) {
  return this.color;
}

/*
 * For a given position, create the highlight.
 * 
 * @param {Object} position Object with x, y, and color indicating the pixels at the grid position and the color.
 * @param {object[]} segments An Array of measured ruler segments.
 *    Each segment has ray, distance, label, last, and idx.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */ 
export function libRulerHighlightPosition(position, color, segments, segment_num) {
	log(`position: ${position.toString()}; color: ${color}`, position, color)
	position.color = color;
  canvas.grid.highlightPosition(this.name, position);
}



