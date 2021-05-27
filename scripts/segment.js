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

/*
Possible movements / representation of a measured path:

(1) modifies the represented physical path 
  (does not modify the ruler display but symbolizes how in fact the token moves in space)
	- elevate into 3-D space (or more dimensions, why not!)
	- approximate a curve or other linear path that may or may not be 2-D
	- interjects something non-linear, like stumbling or teleport, into the path 
	  (probably would require a different measure function to accommodate multiple segments,
	    or would require interjecting segments into the segments Array in some manner)
	- physically deviate the 2-D path from what is represented by the ruler    
(2) modifies rules for measuring distance
 	- e.g., dnd5e measure functions (5-5-5, 5-10-5, Euclidean) 
 	  (built-in to canvas.grid.measureDistances but otherwise would require a function)
 	- possibly some curve approximations (like assuming the ruler represents a thrown object 
 	  along a parabola)
 	- handle modifications from (1), such as projecting 3-D to a 2-D canvas  
(3) increases the cost of the distance amount but not really the path per se
	- multiplier for part or all of a path
	- adder for part or all of a path
	- zero out some or all of the distance cost
- ?

Call a function to get the physical path for a segment for (1).
Call a specified measurement function for (2). 
Apply modifiers in sequence for (3) after measuring the distance.

*/


export class Segment {
  previous_segments = [];
  segment_num = 0;
  last = false;
  flags = {};
  distanceValue = null; // private fields (#distanceValue) not currently supported.
  distanceModifiers = [];
  color = "";
  options = { gridSpaces: true };

  constructor(origin, destination, ruler, previous_segments = [], segment_num = 0, options = {gridSpaces: true}) {
    //if(previous_segments.length > 0 && !previous_segments.every(s => s instanceOf Segment)) {
    //  throw new TypeError("Previous Segments Array not all Segment Class");
    //}
  
    this.previous_segments = previous_segments; // chained Array of previous Segments
    this.segment_num = segment_num; // Index of the segment
    this.ruler = ruler;
    this.ray = this.constructRay(origin, destination);
    this.label = ruler.labels.children[segment_num];
    this.color = ruler.color;    
    this.options = options;
    this.physical_path = this.ray;
    
    this.addProperties();
  }
  
  get totalPriorDistance() {
    return this.previous_segments.reduce((acc, curr) => acc + curr.distance, 0);
  }
  
  get totalDistance() {
    return this.totalPriorDistance + this.distance;
  }

  get distance() {
    // this assumes a distanceValue of 0 should be recalculated, as well as undefined, NaN, or null.
    if(!this.distanceValue) this.recalculateDistance();
    return this.distanceValue;
  }
  
  /*
   * What function to use to measure the distance of a segment?
   * For example, if you didn't like 5e's Euclidean measure, you could implement your own here.
   * @param {Array} See constructPhysicalPath function description.
   */
  distanceFunction(physical_path) {
    log("physical_path", physical_path);
    if(physical_path.length < 2) console.error(`${MODULE_ID}|physical path has less than 2 entries.`, physical_path);
    
    const gridSpaces = this.options.gridSpaces;
    
    let distance_segments = [];
    for(let i = 1; i < physical_path.length; i++) {
      distance_segments.push({ray: this.constructRay(physical_path[i - 1], physical_path[i])});
    }
    
    const distances = canvas.grid.measureDistances(distance_segments, { gridSpaces: this.options.gridSpaces });
    return distances.reduce((acc, d) => acc + d, 0);
  }

  
	/*
	 * Construct a physical path for the segment that represents how the measured item 
	 *   actually would move.
	 *  
	 * The default is [{x0,y0}, {x1, y1}], where {x0, y0} is the origin and 
	 *    {x1, y1} is the destination along the 2-D canvas.
	 * If operating in 3 (or more) dimensions, you should modify this accordingly
	 *   so that other modules can account for physical movement if they want.
	 *   You will also need to modify the distanceFunction to handle a 3-D (or more) measurement.
	 * For multiple dimensions, each point should be: {x, y, z, ...} where z is orthogonal to 
	 *   the x,y plane and each dimension after z is orthogonal to the object prior.
	 *
	 * If you intend to create deviations from a line, the returned object should be an array
	 *   of points where element 0 is origin and element array.length - 1 is destination. 
	 *   Again, modifying distanceFunction will be necessary.   
	 *
	 * @param {Segment} segment If provided, this should be either a Segment class or an object
   *     with the properties ray containing a Ray object. 
   * @return {Array} An Array of points
	 */
   constructPhysicalPath(destination_point = this.ray.B) {
     return [this.ray.A, destination_point];
   }   
  
 /* 
  * Return the distance measured for the segment or alternative destination point. 
  * This is not necessarily the distance of the segment ray that represents the ruler path. 
  * @param {PIXI.Point} destination_point Object with x, y coordinates for the specified point to measure.
  * @return {number} Distance value.
  */
  measureDistance(destination_point = this.ray.B) {
    // Three parts:
    // 1. Construct a physical path to measure based on the segment.
    //    This path does not modify the ruler display but rather symbolizes how
    //    the token moves in space.
    // 2. Use the specified measurement function to measure distance of the physical path.
    // 3. Apply any modifiers (typically a multiple or adder) to the distance number.
    
    // 1. Construct a physical path.    
    const physical_path = this.constructPhysicalPath(destination_point);
    
    // 2. Use specified measurement function.
    const measured_distance = this.distanceFunction(physical_path);
    log(`Distance to point ${destination_point.x}, ${destination_point.y}: ${measured_distance}`);
        
        
    // 3. Apply modifiers    
    const distance_modifiers = this.getDistanceModifiers();
    
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
    // Want to avoid using eval() if possible
    let modifier_string = `${measured_distance}`;
    if(distance_modifiers.length > 0) {
      distance_modifiers.forEach(m => {
        modifier_string = `(${modifier_string} ${m})`;
      });
    }
    
    log(`modifier_string: ${modifier_string}`);
    
    // Note: In theory, modifiers could include function calls if looseJsonParse 
    //       added the function to the scope. 
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
    return looseJsonParse(modifier_string);    
  }
  
  
  /* 
   * Get the text label for the segment.
   */  
  get text() {
    return this.ruler._getSegmentLabel(this.distance, this.totalDistance, this.last);
  }
  
  /*
   * Each segment tracks modifications to the ray.distance.
   * When measuring distance, the ray is first measured as normal, and then 
   * any modifiers are applied in the order they are in the array.
   * This helper function adds a new modifier to the end of the array.
   * You can also modify the array directly by accessing this.distanceModifiers 
   * where 'this' is a segment Class.
   *
   * For more complicated distance measurements, you can wrap measureDistance.
   *
   * Modifier should be a string representing mathematical formula that can be resolved by 
   * eval. It should begin with an operator. Each modifier is applied in turn. For example:
   *   distanceModifiers = [{'+2', "flat penalty"}, {'*3', "multiplier"}]
   *   resolves to ((dist + 2) * 3)
   * @param {string} label A description of the modifier. For informational purposes; can be
   *   any string.
   * @return an array of modifiers
   */
   getDistanceModifiers() {
     // example: return [{'+2', "flat penalty"}, {'*3', "multiplier"}];
     return [];
   }
   
   
  
   /*
   * Force a distance recalculation.
   */
   recalculateDistance() {
     this.distanceValue = this.measureDistance();
   }
  
  /*
   * Ray used to represent the highlighted, or apparent, path traveled 
   *   between origin and destination.
   * Default: straight line between the origin and destination.
   *
   * Note: distance represented by the segment is calculated elsewhere
   *
   * @param {PIXI.Point} origin Where the segment starts on the canvas.
   * @param {PIXI.Point} destination PIXI.Point Where the segment ends on the canvas
   */
   constructRay(origin, destination) {
     return new Ray(origin, destination);
   }
   
    
 
  
  /* 
   * Helper function that allows other labels to be set by modules.
   * Is called when the segment is first constructed.
   * Properties are best added using the Segment Class flag methods.
   *   e.g. this.setFlag("module_id"", "key", value)
   * Or add distance modifiers using the addDistanceModifier helper function.
   */
  addProperties() {
    // wrap if you need to use this.setFlag before distance is calculated.
    // wrap if you need to use this.addDistanceModifier before distance is calculated.
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
   * Draws the end point indicators for the segment.
   * Endpoints are either end of the two waypoints (i.e., the two ends of the ray).
   * To avoid unnecessary repeats, draw only the first point unless we are at the last segment.
   * 
   */
  drawEndpoints() {
    this.ruler.ruler.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(this.ray.A.x, this.ray.A.y, 8);
    
    if(this.last) {
      this.ruler.ruler.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(this.ray.B.x, this.ray.B.y, 8);
    }  
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

// Helper function in lieu of using eval()
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
function looseJsonParse(obj){
    return Function('"use strict";return (' + obj + ')')();
}

