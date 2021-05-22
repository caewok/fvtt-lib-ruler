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
	const segments = [];
	for ( let [i, dest] of waypoints.slice(1).entries() ) {
		const origin = waypoints[i];
		const label = this.labels.children[i];
		
		const ray = this.constructSegmentDistanceRay(origin, dest);
		
		if ( ray.distance < 10 ) {
			if ( label ) label.visible = false;
			continue;
		}
		
		const highlight_ray = this.constructSegmentHighlightRay(origin, dest);
		
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
		s.text = this._getSegmentLabel(d, totalDistance, s.last);
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
	for ( let s of segments ) {
		const {highlight_ray, label, text, last} = s;
		// Draw line segment
		this.drawLineSegment(highlight_ray);
		
		// Draw the distance label just after the endpoint of the segment
		this.drawDistanceSegmentLabel(label, text, last, highlight_ray);
		
		// Highlight grid positions
		this._highlightMeasurement(highlight_ray);
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
 * @param origin PIXI.Point
 * @param dest PIXI.Point
 * 
 */
export function libRulerConstructSegmentDistanceRay(origin, dest) {
	return new Ray(origin, dest);
}

/* 
 * For method constructSegmentHighlightRay
 *
 * Ray used to represent the highlighted, or apparent, path traveled 
 *   between origin and destination.
 * Default: straight line between the origin and destination.
 * But the ray created not necessarily equal to the straight line between.
 * @param origin PIXI.Point
 * @param dest PIXI.Point
 * 
 */
export function libRulerConstructSegmentHighlightRay(origin, dest) {
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
		 .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, highlight_ray.A.y).lineTo(ray.B.x, ray.B.y);
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




