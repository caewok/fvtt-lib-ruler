import { log } from "./module.js";


/* -------------------------------------------- */
/**
 * Measure the distance between two points and render the ruler UI to illustrate it
 * @param {PIXI.Point} destination  The destination point to which to measure
 * @param {boolean} gridSpaces      Restrict measurement only to grid spaces
 * (1) Set destination
 * (2) Construct segment rays for distance measurement and for highlighting / moving
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
	let segments = [];
	for ( let [i, dest] of waypoints.slice(1).entries() ) {
		const origin = waypoints[i];
		const label = this.labels.children[i];
		
		const ray = this.constructSegmentDistanceRay(origin, dest, i + 1);
		
		if ( ray.distance < 10 ) {
			if ( label ) label.visible = false;
			continue;
		}
		
		const highlight_ray = this.constructSegmentHighlightRay(origin, dest, i + 1);
		segments.push({ray, label, highlight_ray});
	}
	
	log("Segments", segments);

	// Check if any segments need to be adjusted now that all paths are determined
	// Function returns segments with any necessary modifications
	segments = this.checkCreatedSegments(segments);
	
	
	// Compute measured distance
	const distances = canvas.grid.measureDistances(segments, {gridSpaces});
	let totalDistance = 0;
	for ( let [i, d] of distances.entries() ) {
		totalDistance += d;
		let s = segments[i];
		s.last = i === (segments.length - 1);
		s.distance = d;
		s.text = this.getSegmentLabel(d, totalDistance, s.last, i + 1);
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
	for ( let [s, i] of segments.entries() ) {
		const {highlight_ray, label, text, last, distance_ray} = s;
		// Draw line segment
		this.drawLineSegment(highlight_ray);
		
		// Draw the distance label just after the endpoint of the segment
		this.drawDistanceSegmentLabel(label, text, last, highlight_ray);
		
		// Highlight grid positions
		this._highlightMeasurement(highlight_ray, distance_ray, i + 1);
	}
	// Draw endpoints
	for ( let p of waypoints ) {
	  this.drawSegmentEndpoints(p);	
	}
	// Return the measured segments
	return segments;
}

/*
 * For method setDestination
 * @param {PIXI.Point} destination  The destination point to which to measure
 */
export function libRulerMeasureSetDestination(destination) {
  destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
  this.destination = destination;
}

/* 
 * For method constructSegmentDistanceRay
 *
 * Ray used to represent the path traveled between origin and destination.
 * Default: straight line between the origin and destination.
 * But the ray created not necessarily equal to the straight line between.
 *
 * @param {PIXI.Point} origin Where the segment starts on the canvas.
 * @param {PIXI.Point} dest PIXI.Point Where the segment ends on the canvas
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 */
export function libRulerConstructSegmentDistanceRay(origin, dest, segment_num) {
	return new Ray(origin, dest);
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
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
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
 * @param ray PIXI.Point
 */
export function libRulerDrawLineSegment(ray) {
  this.ruler.lineStyle(6, 0x000000, 0.5).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y)
		 .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y);
}

/* 
 * For method drawDistanceSegmentLabel
 *
 * Takes the segment array and draws the highlighted measure line on the canvas.
 * @param ray PIXI.Point
 */
export function libRulerDrawDistanceSegmentLabel(label, text, last, ray) {
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
 * Takes the segment array and draws the highlighted measure line on the canvas.
 * @param ray PIXI.Point
 */
export function libRulerDrawSegmentEndpoints(waypoint) {
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
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 * @return {string} Text label displayed in the rule to indicate distance traveled.
 */
export function libRulerGetSegmentLabel(segmentDistance, totalDistance, isTotal, segment_num) {
  return this._getSegmentLabel(segmentDistance, totalDistance, isTotal);
}


/* 
 * For method highlightMeasurement
 *
 * Expanded version of _highlightMeasurement.
 * @param {Ray} highlight_ray Ray representing the path from origin to destination on the canvas for a segment
 * @param {Ray} distance_ray Ray representing the distance moved for the segment. May or may not equal highlight ray
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 */
export function libRulerHighlightMeasurement(highlight_ray, distance_ray, segment_num) {
  // In the default setup, highlight ray is the ray that is measured
  
	const spacer = canvas.scene.data.gridType === CONST.GRID_TYPES.SQUARE ? 1.41 : 1;
	const nMax = Math.max(Math.floor(highlight_ray.distance / (spacer * Math.min(canvas.grid.w, canvas.grid.h))), 1);
	const tMax = Array.fromRange(nMax+1).map(t => t / nMax);
	
	// Track prior position
	let prior = null;
	
	// Iterate over ray portions
	for ( let [i, t] of tMax.entries() ) {
		let {x, y} = highlight_ray.project(t);
		
		// Get grid position
		let [x0, y0] = (i === 0) ? [null, null] : prior;
		let [x1, y1] = canvas.grid.grid.getGridPositionFromPixels(x, y);
		if ( x0 === x1 && y0 === y1 ) continue;
		
		// Highlight the grid position
		let [xg, yg] = canvas.grid.grid.getPixelsFromGridPosition(x1, y1);
		const color = this.getColor({x: xg, y: yg}, highlight_ray, distance_ray, segment_num);
		this.highlightPosition({x: xg, y: yg, color: color}, highlight_ray, distance_ray, segment_num);
				
		// Skip the first one
		prior = [x1, y1];
		if ( i === 0 ) continue;
		
		// If the positions are not neighbors, also highlight their halfway point
		if ( !canvas.grid.isNeighbor(x0, y0, x1, y1) ) {
			let th = tMax[i - 1] + (0.5 / nMax);
			let {x, y} = ray.project(th);
			let [x1h, y1h] = canvas.grid.grid.getGridPositionFromPixels(x, y);
			let [xgh, ygh] = canvas.grid.grid.getPixelsFromGridPosition(x1h, y1h);
			
			const color = this.getColor({x: xgh, y: ygh}, highlight_ray, distance_ray, segment_num);
			this.highlightPosition(this.name, {x: xgh, y: ygh, color: color})
		}
	}
}

/*
 * For a given position, return the color for the ruler highlight.
 * @param {Object} position Object with x and y indicating the pixels at the grid position.
 * @param {Ray} highlight_ray Ray representing the path from origin to destination on the canvas for a segment
 * @param {Ray} distance_ray Ray representing the distance moved for the segment. May or may not equal highlight ray
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 * @param return {string} Color string
 */
export function libRulerGetColor(position, highlight_ray, distance_ray, segment_num) {
  return this.color;
}

/*
 * For a given position, create the highlight.
 * 
 * @param {Object} position Object with x, y, and color indicating the pixels at the grid position and the color.
 * @param {Ray} highlight_ray Ray representing the path from origin to destination on the canvas for a segment
 * @param {Ray} distance_ray Ray representing the distance moved for the segment. May or may not equal highlight ray
 * @param {integer} segment_num The segment number, where 1 is the
 *    first segment between origin and the first waypoint (or destination),
 *    2 is the segment between the first and second waypoints.
 *
 *    The segment_num can also be considered the waypoint number, equal to the index 
 *    in the array this.waypoints.concat([this.destination]). Keep in mind that 
 *    the first waypoint in this.waypoints is actually the origin 
 *    and segment_num will never be 0.
 */ 
export function libRulerHighlightPosition(position, highlight_ray, distance_ray, segment_num) {
  canvas.grid.highlightPosition(this.name, position);
}



