// Utility functions related to ruler measurement that can be used by other modules.
// All added to window.libRuler in module.js file.

export class RulerUtilities {

 /*
  * Calculate a new point by projecting the elevated point back onto the 2-D surface
  * If the movement on the plane is represented by moving from point A to point B,
  *   and you also move 'height' distance orthogonal to the plane, the distance is the
  *   hypotenuse of the triangle formed by A, B, and C, where C is orthogonal to B.
  *   Project by rotating the vertical triangle 90º, then calculate the new point C. 
  *
  * Cx = { height * (By - Ay) / dist(A to B) } + Bx
  * Cy = { height * (Bx - Ax) / dist(A to B) } + By
  * @param {{x: number, y: number}} A
  * @param {{x: number, y: number}} B
  */
static projectElevatedPoint(A, B) {
  const height = B.z - A.z;
  const distance = RulerUtilities.calculateDistance(A, B);
  const projected_x = B.x + ((height / distance) * (A.y - B.y));
  const projected_y = B.y - ((height / distance) * (A.x - B.x));

  return new PIXI.Point(projected_x, projected_y);
}

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

// From Terrain Ruler -----------------------
// Wrapper to fix a FoundryVTT bug that causes the return values of canvas.grid.grid.getPixelsFromGridPosition to be ordered inconsistently

// https://gitlab.com/foundrynet/foundryvtt/-/issues/4705
 /*
  * @param {Number} xGrid   Grid x position
  * @param {Number} yGrid   Grid y position
  * @return {[Number, Number]} Array with x and y position (pixel location).
  */
static getPixelsFromGridPosition(xGrid, yGrid) {
	if (canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS) {
		return canvas.grid.grid.getPixelsFromGridPosition(yGrid, xGrid)
	}
	return canvas.grid.grid.getPixelsFromGridPosition(xGrid, yGrid)
}

// Wrapper to fix a FoundryVTT bug that causes the return values of canvas.grid.grid.getPixelsFromGridPosition to be ordered inconsistently
// https://gitlab.com/foundrynet/foundryvtt/-/issues/4705
/*
 * @param {Number} xPixel   Pixel position up/down
 * @param {Number} yPixel   Pixel position left/right
 * @return {[Number, Number]} Array with x and y position (grid location).
 */
static getGridPositionFromPixels(xPixel, yPixel) {
	const [x, y] = canvas.grid.grid.getGridPositionFromPixels(xPixel, yPixel)
	if (canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS)
		return [y, x]
	return [x, y]
}

/*
 * Generator to iterate over pairs of array objects, in order.
 * If arr = [0,1,2], this returns [0,1], then [1,2]. 
 * @param {Array} arr   Array or other object that can be sequenced using []
 * @return Iterator, which in turn would return Array containing two elements from arr, in sequence. 
 */
function* iteratePairs(arr) {
	for (let i = 0;i < arr.length - 1;i++) {
		yield [arr[i], arr[i + 1]];
	}
}


}

  
