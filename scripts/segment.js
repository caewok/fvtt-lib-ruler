import { log } from "./module.js";
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag 
       } from "./ruler-flags.js";
       
// Define a Segment class used by Ruler.measure
// The segment represents the path between two 
// waypoints (incl. origin or destination) in a ruler.
// Segments are chained: each Segment contains a previous_segments Array 
// that should include each of the earlier segments in the Ruler path


export class Segment {
  previous_segments = [];
  segment_num = 0;
  last = false;
  flags = {};
  distanceValue = null; // private fields (#distanceValue) not currently supported.
  color = "";
  options = { gridSpaces: true };

  constructor(ray, ruler, previous_segments = [], segment_num = 0, options = {gridSpaces: true}) {
    //if(previous_segments.length > 0 && !previous_segments.every(s => s instanceOf Segment)) {
    //  throw new TypeError("Previous Segments Array not all Segment Class");
    //}
  
    this.previous_segments = previous_segments; // chained Array of previous Segments
    this.segment_num = segment_num; // Index of the segment
    this.ruler = ruler;
    this.ray = ray;
    
    this.label = ruler.labels.children[segment_num];
    this.color = ruler.color;    
    this.options = options;
    
    this.addProperties();
  }
  
  get totalPriorDistance() {
    return this.previous_segments.reduce((acc, curr) => acc + curr.distance, 0);
  }
  
  get totalDistance() {
    return this.totalPriorDistance + this.distance;
  }
    
  /* 
   * Get the text label for the segment.
   */  
  get text() {
    return this.ruler._getSegmentLabel(this.distance, this.totalDistance, this.last);
  }

  get distance() {
    // this assumes a distanceValue of 0 should be recalculated, as well as undefined, NaN, or null.
    if(!this.distanceValue) this.recalculateDistance();
    return this.distanceValue;
  }
    
  /*
   * Force a distance recalculation.
   */
   recalculateDistance() {
     this.distanceValue = this.measureDistance();
   }
  
  /* 
   * Helper function that allows other labels to be set by modules.
   * Is called when the segment is first constructed.
   * Properties are best added using the Segment Class flag methods.
   *   e.g. this.setFlag("module_id"", "key", value)
   */
  addProperties() {
    // wrap if you need to add flags before distance is calculated.
  }

  /*
   * Draws the highlighted measure line on the canvas for the segment.
   */
	drawLine() {
		const ray = this.ray;

		this.ruler.ruler.lineStyle(6, 0x000000, 0.5).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y)
		 .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y);
	}
  
  /*
   * Draws the highlighted measure line on the canvas.
   */
  drawDistanceLabel() {
    const label = this.label;
    const text = this.text;
    const ray = this.ray;
    const last = this.last;
	
		if ( label ) {
				label.text = text;
				label.alpha = last ? 1.0 : 0.5;
				label.visible = true;
				let labelPosition = ray.project((ray.distance + 50) / ray.distance);
				label.position.set(labelPosition.x, labelPosition.y);
			}
		return label;	// in case another module wants to modify the label.
  }
  
  /*
   * Draws the end point indicators for the segment
   */
  drawEndpoints(point) {
     this.ruler.ruler.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(point.x, point.y, 8);
  }
  
  /* 
   * Modified version of Ruler._highlightMeasurement
   */
  highlightMeasurement() {
    const ray = this.ray;
  
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
			this.highlightPosition({x: xg, y: yg});
				
			// Skip the first one
			prior = [x1, y1];
			if ( i === 0 ) continue;
		
			// If the positions are not neighbors, also highlight their halfway point
			if ( !canvas.grid.isNeighbor(x0, y0, x1, y1) ) {
				let th = tMax[i - 1] + (0.5 / nMax);
				let {x, y} = ray.project(th);
				let [x1h, y1h] = canvas.grid.grid.getGridPositionFromPixels(x, y);
				let [xgh, ygh] = canvas.grid.grid.getPixelsFromGridPosition(x1h, y1h);
				this.highlightPosition({x: xgh, y: ygh})
			}
		}
  
  }
  
/*
 * For a given position, create the highlight.
 * 
 * @param {Object} position Object with x, y, and color indicating the pixels at the grid position and the color.
 */
  highlightPosition(position) {
    position.color = this.colorForPosition(position);
    canvas.grid.highlightPosition(this.ruler.name, position);
  }
  
 /* 
  * Return the distance measured for the segment. This is not necessarily the 
  * distance of the segment ray. 
  * @return {number} Distance measurement
  */
  measureDistance() {
    return canvas.grid.measureDistances([this], {gridSpaces: this.options.gridSpaces})[0];
  }
  
  /*
   * For a given position, return the color for the ruler highlight.
   * @param {Object} position Object with x and y indicating the pixels at the grid position.
   */
  colorForPosition(position) {
    return this.color;
  }
}
 
Segment.prototype.getFlag = libRulerGetFlag;
Segment.prototype.setFlag = libRulerSetFlag;
Segment.prototype.unsetFlag = libRulerUnsetFlag;
