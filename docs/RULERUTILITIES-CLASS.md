# libRuler RulerUtilities Class
libRuler defines a set of static helper methods under the RulerUtilities class. Modules (and macros) can access the `RulerUtilities` class from window: `window.libRuler.RulerUtilities`.

# Table of Contents
<!--- TOC created using ./Scripts/gh-md-toc -->

# `RulerUtilities` static methods

## `RulerUtilities.almostEqual` 
Parameters:
- {Number} x   
- {Number} y 
- {Number} EPSILON   Small number representing error within which the numbers will be considered equal.

Returns: {Boolean} True if x and y are within the error of each other.

## `RulerUtilities.calculateDistance`
Parameters:
- {PIXI.Point} A   Point in {x, y} format.
- {PIXI.Point} B   Point in {x, y} format.

Returns: The distance between the two points.

Takes shortcuts where x or y are in a line; otherwise uses `Math.hypot` to determine the distance.

## `RulerUtilities.iterateGridUnderLine` (generator)
Parameters:
- {x: Number, y: Number} origin Origination point
- {x: Number, y: Number} destination Destination point

Returns: Iterator, which in turn returns [row, col] Array for each grid point under the line between origin and destination.

## `RulerUtilities.pointsAlmostEqual`  
Parameters:
- {PIXI.Point} p1  Point in {x, y} format.
- {PIXI.Point} p2  Point in {x, y} format.
- {Number} EPSILON. Error window. Default: 1e-6.

Returns: {Boolean} True if the points are within the error of each other. 

Uses `RulerUtilities.almostEqual` to compare x and y of the points.  
