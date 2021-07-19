import { log } from "./module.js";
import { libRulerGetFlag,
         libRulerSetFlag,
         libRulerUnsetFlag 
       } from "./ruler-flags.js";
       
// Define a RulerSegment class used by Ruler.measure
// The segment represents the path between two 
// waypoints (incl. origin or destination) in a ruler.
// RulerSegments are chained: each RulerSegment contains a previous_segments Array 
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


export class RulerSegment {
 
  constructor(origin, destination, ruler, prior_segment = {}, segment_num = 0, measure_distance_options = {gridSpaces: true}) {
    //if(previous_segments.length > 0 && !previous_segments.every(s => s instanceOf RulerSegment)) {
    //  throw new TypeError("Previous Segments Array not all RulerSegment Class");
    //}
    
    // basic defaults
    this.last = false;
    this.flags = {};
    this.distanceValue = null; // private fields (#distanceValue) not currently supported.
    this.distanceModifiers = [];

    this.prior_segment = prior_segment; // chained prior RulerSegment
    this.segment_num = segment_num; // Index of the segment
    this.ruler = ruler;
    this.ray = this.constructRay(origin, destination);
    this.label = ruler.labels.children[segment_num];
    this.color = ruler.color;    
    this.measure_distance_options = measure_distance_options;
    this.physical_path = this.ray;
    
    this.addProperties();
  }
  
  get totalPriorDistance() {
    // if no prior segments, should be 0.
    if(!this.prior_segment || Object.keys(this.prior_segment).length === 0) return 0;
    
    // first method: just get the prior segment total distance.
    const total_prior_distance = this.prior_segment.totalDistance; 
    
    // second method: pull the distance property from traversing the prior segments and add up.
    //const total_prior_dist_arr = this.traversePriorSegments(this.prior_segment, "distance"); 
    //const total_prior_dist_m2 = total_prior_dist_arr.reduce((acc, curr) => acc + curr, 0) || 0;
    
    //log(`RulerSegment ${this.segment_num}: Prior distance ${total_prior_distance} vs method 2 ${total_prior_dist_m2}`, total_prior_dist_arr);
     
    return total_prior_distance;
  }
  
  get totalDistance() {
    const total_prior_distance = this.totalPriorDistance;
    const total_current_distance = this.distance;
    log(`RulerSegment ${this.segment_num}: Prior distance ${total_prior_distance} + current distance ${total_current_distance}`);
  
    return total_prior_distance + total_current_distance;
  }

  get distance() {
    // this assumes a distanceValue of 0 should be recalculated, as well as undefined, NaN, or null.
    if(!this.distanceValue) this.recalculateDistance();
    return this.distanceValue;
  }
  
  /*
   * Function to measure the distance of a segment.
   * For example, if you didn't like 5e's Euclidean measure, you could implement your own here.
   * Note that the default here relies on canvas.grid.measureDistances, which 5e overrides with 
   *   three different measurement functions, depending on user-setting. 
   * @param {Object} See constructPhysicalPath function description.
   * @return {Number} The distance of the segment.
   */
  distanceFunction(physical_path) {
    log("physical_path", physical_path);
    if(!physical_path.origin) console.error(`${MODULE_ID}|physical path has no origin.`, physical_path);
    if(!physical_path.destination) console.error(`${MODULE_ID}|physical path has no destination.`, physical_path);
        
    //  canvas.grid.measureDistances takes an array of segments
    let distance_segments = [{ ray: this.constructRay(physical_path.origin, physical_path.destination) }];
    const distances = canvas.grid.measureDistances(distance_segments, this.measure_distance_options);
    
    // In the default, should only be one distance...
    return distances.reduce((acc, d) => acc + d, 0);
  }

  
  /*
   * Construct a physical path for the segment that represents how the measured item 
   *   actually would move.
   *  
   * The default is an Object {origin: {x0,y0}, destination: {x1, y1}}, representing
   *   a physical line along the 2-D canvas.
   * If operating in 3 (or more) dimensions, you should modify this accordingly
   *   so that other modules can account for physical movement if they want.
   *   You would also need to modify the distanceFunction to handle a 3-D (or more) measurement.
   * For multiple dimensions, each point should be: {x, y, z, ...} where z is orthogonal to 
   *   the x,y plane and each dimension after z is orthogonal to the object prior.
   *
   * If you intend to create deviations from a line, you may want to include 
   *   additional properties to represent those deviations. For example, a property 
   *   for a formula to represent a curve.
   *   Again, modifying distanceFunction would be necessary.   
   *
   * @param {RulerSegment} destination_point If provided, this should be either a RulerSegment class or an object
   *     with the properties ray containing a Ray object. 
   * @return {Object} An object that contains {origin, destination}. 
   *   It may contain other properties related to the physical path to be handled by specific modules.
   */
   constructPhysicalPath(destination_point = this.ray.B) {
     log("Physical path from origin to destination", this.ray.A, destination_point);
     
     // Changed from array to allow simpler returns in the base case.
     // Module may add intermediate points or other representations by adding properties.
   
     return { origin: this.ray.A, destination: destination_point };
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
    // 3. Modify the resulting distance number.
    
    // 1. Construct a physical path.    
    log(`Constructing physical path.`);
    const physical_path = this.constructPhysicalPath(destination_point);
    
    // 2. Use specified measurement function.
    const measured_distance = this.distanceFunction(physical_path);
    log(`Distance to point ${destination_point.x}, ${destination_point.y}: ${measured_distance}`);
        
    // 3. Apply modifiers 
    return this.modifyDistanceResult(measured_distance);
  }
  
  
  /* 
   * Get the text label for the segment.
   */  
  get text() {
    const total_distance = this.totalDistance;
    const total_current_distance = this.distance;
    log(`Total distance ${total_distance} + current distance ${total_current_distance}`);
  
    return this.ruler._getSegmentLabel(total_current_distance, total_distance, this.last);
  }
  
  /*
   * Each segment permits modifications to the measured ray distance.
   * For example, a module might penalize the distance based on terrain.
   * Conceptually, this function should be used if you are not modifying the 
   *   physical path but instead applying penalties, bonuses, or other extraneous
   *   values to represent the "cost" of the path.
   *
   * Note that all the properties of the Segment being measured 
   *   are available here using this.
   * 
   * For more complicated distance measurements, you can wrap measureDistance.
   *
   * @param {Number} measured_distance The distance measured for the physical path.
   * @return {Number} The distance as modified.
   */
   modifyDistanceResult(measured_distance) {
     return measured_distance;
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
   * Helper function: traverse the prior segments.
   * pull a property or execute a method with supplied arguments for each prior segment.
   */
   
  traversePriorSegments(segment, prop, ...args) { 
    //log(`traversing ${prop} which is type ${typeof segment[prop]}.`, segment)  
    if(!segment || Object.keys(segment).length === 0) {
      //log("Returning []")
      return [];
    }
    if(!(segment instanceof RulerSegment)) console.error("libRuler|traversePriorSegments limited to RulerSegment class objects.");

    let results = [];
  
    // get the value for this object

    if(prop in segment) {
      const is_function = segment[prop] instanceof Function;
      
      //log(`segment has property ${prop} which is ${is_function ? "" : "not"} a function.`);
      const res = is_function ? segment[prop](...args) : segment[prop];
      results.push(res);
    } 
  
    // find the parent for the object; traverse if not empty
    if(segment.prior_segment && Object.keys(segment.prior_segment).length > 0) {
      results = results.concat(this.traversePriorSegments(segment.prior_segment, prop, ...args));
    } 
    
    //log(`Returning array length ${results.length}`, results);
  
    return results;
  }

 
  
  /* 
   * Helper function that allows other labels to be set by modules.
   * Is called when the segment is first constructed.
   * Properties are best added using the RulerSegment Class flag methods.
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
        log(`Drawing label ${text}.`);
        label.text = text;
        label.alpha = last ? 1.0 : 0.5;
        label.visible = true;
        let labelPosition = ray.project((ray.distance + 50) / ray.distance);
        label.position.set(labelPosition.x, labelPosition.y);
      }
    return label;  // in case another module wants to modify the label.
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
   * This version allows modules to override highlightPosition,
   *   used for things like changing the color of the ruler highlight.
   * If somehow a module calls the original version, this function provides
   *   for a compatible version. The original is called from Ruler class, not RulerSegment class.
   * @param {Ray} Optional Ray. Kept for compatibility with original function.
   * 
   */
  highlightMeasurement(ray = this.ray) {
    const is_ruler_class = !(this instanceof RulerSegment);
    
    if(is_ruler_class) {
      console.warn("libRuler|A modules is calling the original _highlightMeasurement function. This may cause unanticipated errors");
    }
      
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
      if(is_ruler_class) {
        canvas.grid.highlightPosition(this.name, {x: xg, y: yg, color: this.color});
      } else {
        this.highlightPosition({x: xg, y: yg});
      }
        
      // Skip the first one
      prior = [x1, y1];
      if ( i === 0 ) continue;
    
      // If the positions are not neighbors, also highlight their halfway point
      if ( !canvas.grid.isNeighbor(x0, y0, x1, y1) ) {
        let th = tMax[i - 1] + (0.5 / nMax);
        let {x, y} = ray.project(th);
        let [x1h, y1h] = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let [xgh, ygh] = canvas.grid.grid.getPixelsFromGridPosition(x1h, y1h);
        if(is_ruler_class) {
          canvas.grid.highlightPosition(this.name, {x: xgh, y: ygh, color: this.color});
        } else {
          this.highlightPosition({x: xgh, y: ygh})
        }
        
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
 
// Pull in flag functions. See ruler-flags.js 
RulerSegment.prototype.getFlag = libRulerGetFlag;
RulerSegment.prototype.setFlag = libRulerSetFlag;
RulerSegment.prototype.unsetFlag = libRulerUnsetFlag;

