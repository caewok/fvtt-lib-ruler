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

	this.setDestination(destination);
	
	const waypoints = this.waypoints.concat([this.destination]);
	const r = this.ruler;
	
	// Iterate over waypoints and construct segment rays
	// Each ray represents the path of the ruler on the canvas
	let segments = [];
	for ( let [i, dest] of waypoints.slice(1).entries() ) {
		const origin = waypoints[i];
		const label = this.labels.children[i];
		
		const ray = this.constructSegmentHighlightRay(origin, dest, i);
		
		if ( ray.distance < 10 ) {
			if ( label ) label.visible = false;
			continue;
		}
		
		segments.push({ ray, label });
	}
	
	log("Segments", segments);

	// Check if any segments need to be adjusted now that all paths are determined
	// Function returns segments with any necessary modifications
	segments = this.checkCreatedSegments(segments);
	
	// Compute measured distance; one per segment
	const distances = this.measureDistances(segments, {gridSpaces});
	log("Distances", distances);
	
	let totalDistance = 0;
	for ( let [i, d] of distances.entries() ) {
	  log(`Distance entry ${i}: ${d}; Total Distance: ${totalDistance}.`);
		totalDistance += d;
		let s = segments[i];
		s.last = i === (segments.length - 1);
		s.distance = d;
		s.text = this.getSegmentLabel(d, totalDistance, s.last, i);
	}
  
  log("Segments after distance measure", segments);
  // segments is an array of objects.
	// each object has distance, label, last, ray, text
  log("Distances", distances);
 
	// Clear the grid highlight layer
  // Unclear why this check is necessary; not needed in original.
  if(!canvas.grid.highlightLayers.hasOwnProperty(this.name)) {
    log(`canvas.grid.highlightLayers does not include ${this.name}; adding.`);
    canvas.grid.addHighlightLayer(this.name);
  }

  log("canvas.grid.highlightLayers", canvas.grid.highlightLayers); 
  const hlt = canvas.grid.highlightLayers[this.name];
  hlt.clear();
	// Draw measured path
	r.clear();
	for ( let [i, s] of segments.entries() ) {
    log(`segment ${i}`, s);
    log(`segments`, segments)
		const {ray, label, text, last} = s;
		// Draw line segment
		this.drawLineSegment(ray, segments, i);
		
		// Draw the distance label just after the endpoint of the segment
		this.drawDistanceSegmentLabel(label, text, last, ray, segments, i);
		
		// Highlight grid positions
		this._highlightMeasurement(ray, segments, i);
	}
	// Draw endpoints
	for ( let [i, p] of waypoints.entries() ) {
	  this.drawSegmentEndpoints(p, segments, i);	
	}
	// Return the measured segments
	return segments;
}

/*
 * For method Ruler.setDestination
 *
 * @param {PIXI.Point} destination  The destination point to which to measure
 */
export function libRulerMeasureSetDestination(destination) {
  destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
  this.destination = destination;
}

/* 
 * For method Ruler.measureDistances
 *
 * Measure the distance traversed over an array of segments.
 * This measurement indicates how much "distance" it costs to cover the segments.
 * NOTE: Consider overriding Ruler.measureDistance instead of this function.
 *       If overriding this function, you should call Ruler.measureDistance
 *       to accommodate other modules that may rely on measureDistance.
 * 
 * @param {object[]} segments An Array of measured ruler segments
 * @param {boolean} gridSpaces      Restrict measurement only to grid spaces
 * @return {numeric[]} An Array of distances, one per segment. 
 */
export function libRulerMeasureDistances(segments, {gridSpaces=true}={}) {
  log(`Measuring distances for ${segments.length} segments.`);
  const distances = segments.map((s, i) => {
    return this.measureDistance(s, i, {gridSpaces: gridSpaces});
  }, this);
   log(`Distances are ${distances}.`, distances);
   return distances;
  
}

/*
 * For method Ruler.measureDistance
 *
 * This measurement indicates how much "distance" it costs to cover the segment.
 * The returned value may or may not be equivalent to the length of the segment.
 * @param {object} segment Represents the ruler path on the canvas between two waypoints.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @param {boolean} gridSpaces      Restrict measurement only to grid spaces
 * @return {numeric} The measured distance represented by the segment.
 */
export function libRulerMeasureDistance(segment, segment_num, {gridSpaces=true}={}) {
  log(`Measure distance for segment ${segment_num}.`);
  const dist = canvas.grid.measureDistances([segment], {gridSpaces: gridSpaces});
  log(`Distance is ${dist}.`, dist);
  return dist[0];
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
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerConstructSegmentHighlightRay(origin, dest, segment_num) {
	return new Ray(origin, dest);
}

/* 
 * For method checkCreatedSegments
 *
 * Function takes in the full segment array and returns the segment array.
 * Permits modifications, if necessary, once the entire segment array is constructed.
 * @param segments Array of segment objects. See libRulerMeasure.
 */
export function libRulerCheckCreatedSegments(segments) {
  return segments;
}

/* 
 * For method drawLineSegment
 *
 * Takes the segment array and draws the highlighted measure line on the canvas.
 * @param {Ray} ray Ray representing the measure line.
 * @param {object[]} segments An Array of measured ruler segments.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerDrawLineSegment(ray, segments, segment_num) {
  this.ruler.lineStyle(6, 0x000000, 0.5).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y)
		 .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y);
}

/* 
 * For method drawDistanceSegmentLabel
 *
 * Draws the highlighted measure line on the canvas.
 * @param {object} label Object representing the ruler label 
 * @param {string} text What the label should say
 * @param {boolean} last Is this the last segment?
 * @param {Ray} ray Represents the measure line.
 * @param {object[]} segments An Array of measured ruler segments.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerDrawDistanceSegmentLabel(label, text, last, ray, segments, segment_num) {
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
 * @param {number} segmentDistance
 * @param {number} totalDistance
 * @param {boolean} isTotal
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 * @return {string} Text label displayed in the rule to indicate distance traveled.
 */
export function libRulerGetSegmentLabel(segmentDistance, totalDistance, isTotal, segment_num) {
  return this._getSegmentLabel(segmentDistance, totalDistance, isTotal);
}


/* 
 * For method highlightMeasurement
 *
 * Expanded version of _highlightMeasurement.
 * @param {Ray} ray Ray representing the path from origin to destination on the canvas for a segment
 * @param {object[]} segments An Array of measured ruler segments.
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */
export function libRulerHighlightMeasurement(ray, segments, segment_num) {
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
		log(`Color: ${color} at x,y ${xg}, ${yg}`, this);
    this.highlightPosition({x: xg, y: yg, color: color}, segments, segment_num);
				
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
			log(`Color: ${color} at x,y ${xgh}, ${ygh}`, this);
			this.highlightPosition({x: xgh, y: ygh}, color, segments, segment_num)
		}
	}
  log("Finished libRulerHighlightMeasurement.");
}

/*
 * For a given position, return the color for the ruler highlight.
 * @param {Object} position Object with x and y indicating the pixels at the grid position.
 * @param {object[]} segments An Array of measured ruler segments.
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
 * @param {integer} segment_num The segment number, where 0 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The start of segment_num X is waypoint X. 
 *    So the start of segment_num 0 is waypoint 0 (origin);
 *    segment_num 1 starts at waypoint 1, etc.  
 */ 
export function libRulerHighlightPosition(position, color, segments, segment_num) {
	log(`position: ${position}; color: ${color}, name: ${this.name}`, position)
	position.color = color;
  canvas.grid.highlightPosition(this.name, position);
}



