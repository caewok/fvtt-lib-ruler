// Utility functions related to ruler measurement that can be used by other modules.
// All added to window.libRuler in module.js file.

export class RulerUtilities {

 /*
  * Calculate the distance between two points in {x,y} dimensions.
  * @param {PIXI.Point} A   Point in {x, y} format.
  * @param {PIXI.Point} B   Point in {x, y} format.
  * @return The distance between the two points.
  */
static calculateDistance(A, B, EPSILON = 1e-6) {
  // could use pointsAlmostEqual function but this avoids double-calculating
  const dx = Math.abs(B.x - A.x); 
  const dy = Math.abs(B.y - A.y);
  if(dy < EPSILON && dx < EPSILON) { return 0; }
  if(dy < EPSILON) { return dx; }
  if(dx < EPSILON) { return dy; }

  return Math.hypot(dy, dx);
}

 /*
  * Test if two points are almost equal, given a small error window.
  * @param {PIXI.Point} p1  Point in {x, y} format.
  * @param {PIXI.Point} p2  Point in {x, y} format.
  * @return {Boolean} True if the points are within the error of each other 
  */
static pointsAlmostEqual(p1, p2, EPSILON = 1e-6) {
  return RulerUtilities.almostEqual(p1.x, p2.x, EPSILON) && RulerUtilities.almostEqual(p1.y, p2.y, EPSILON);
}
	
 /*
  * Test if two numbers are almost equal, given a small error window.
  * From https://www.toptal.com/python/computational-geometry-in-python-from-theory-to-implementation
  * @param {Number} x         First number
  * @param {Number} y         Second number for comparison
  * @param {Number} EPSILON   Small number representing error within which the numbers 
  *                           will be considered equal
  * @return {Boolean} True if x and y are within the error of each other.
  */
static almostEqual(x, y, EPSILON = 1e-6) {
  return Math.abs(x - y) < EPSILON;
}

/*
 * Generator to iterate grid points under a line.
 * @param {x: Number, y: Number} origin Origination point
 * @param {x: Number, y: Number} destination Destination point
 * @return Iterator, which in turn 
 *   returns [row, col] Array for each grid point under the line.
 */
static * iterateGridUnderLine(origin, destination) {
  const ray = new Ray(origin, destination);
  const spacer = canvas.scene.data.gridType === CONST.GRID_TYPES.SQUARE ? 1.41 : 1;
  const nMax = Math.max(Math.floor(ray.distance / (spacer * Math.min(canvas.grid.w, canvas.grid.h))), 1);
  const tMax = Array.fromRange(nMax+1).map(t => t / nMax);
  
  // Track prior position
  let prior = null;
  
  for ( let [i, t] of tMax.entries() ) {
    let {x, y} = ray.project(t);
    
    // Get grid position
    let [row0, col0] = (i === 0) ? [null, null] : prior;
    let [row1, col1] = canvas.grid.grid.getGridPositionFromPixels(x, y);
    if ( row0 === row1 && col0 === col1 ) continue;
    
    // Skip the first one
    prior = [row1, col1];
    if ( i === 0 ) continue;
    
    // If the positions are not neighbors, also highlight their halfway point
    if ( !canvas.grid.isNeighbor(row0, col0, row1, col1) ) {
      let th = tMax[i - 1] + (0.5 / nMax);
      let {x, y} = ray.project(th);
      let [row01h, col01h] = canvas.grid.grid.getGridPositionFromPixels(x, y);
      yield [row01h, col01h];
    }
    
    yield [row1, col1];
  }
  
}

}
  
