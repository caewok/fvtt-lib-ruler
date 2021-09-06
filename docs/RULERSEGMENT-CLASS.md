# libRuler RulerSegment Class
libRuler defines a new `RulerSegment` Class](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/segment.js) class. The class represents a single ruler segment between two waypoints (where origin and destination are also waypoints).

Modules (and macros) can access the `RulerSegment` class from window: `window.libRuler.RulerSegment`. 

libRuler overrides `Ruler.prototype.measure` so that its `for` loop through the waypoints now creates a new `RulerSegment` for each loop. Then `Ruler.prototype.measure` calls the relevant `RulerSegment` method to draw the various parts of the ruler: line, distance label, highlighted grid squares, and endpoints for the waypoints at either end of the segment.

One big change from the Foundry core is how libRuler permits modules to build upon one another for calculating distance. This is accomplished in the `RulerSegment.prototype.measureDistance` method. Measuring distance is done in three stages:
1. `RulerSegment.prototype.constructPhysicalPath`. 
2. `RulerSegment.prototype.measurePhysicalPath`. 
  - Calls `RulerSegment.prototype.distanceFunction`
    - Calls `canvas.grid.measureDistances`
3. `RulerSegment.prototype.modifyDistanceResult`.

# Table of Contents
<!--- TOC created using ./Scripts/gh-md-toc -->

# `RulerSegment` Class constructor

- {PIXI.Point} origin: Starting waypoint of the segment.
- {PIXI.Point} destination: Ending waypoint of the segment.
- {Object} ruler: The ruler object that created/owns this segment.
- prior_segment = {}: The previous RulerSegment, if any.
- segment_num = 0: The Segment number. 
- options = {}: Optional parameters to pass to the options property.

Note that RulerSegment contains a link to the Ruler Class (this.ruler) and a link to the prior segment in the chain (this.prior_segment), if any. These can be useful for accessing ruler-wide properties or chaining segment properties, respectively.

The constructor calls `RulerSegment.prototype.addProperties`, described below.

# Select `RulerSegment` class properties

The following properties of the `RulerSegment` class may be useful to module writers:
- `last`: True if this is the last segment for the ruler.
- `prior_segment`: The previous `RulerSegment` or {} if this is the first segment originating from the measured start point.
- `segment_num`: Number of the segment, where 0 is the first segment originating from the measured start point.
- `ruler`: Parent ruler for this segment.
- `ray`: Ray representing the segment line.
- `label`: Ruler label corresponding to the segment.
- `color`: Color associated with the segment.
- `opacityMultipliers`: Parameters for how much opacity (alpha) should be used for lines, endpoints, and highlights. Note these are multipliers of the Foundry default numbers. Default: { line: 1, endpoint: 1, highlight: 1 }.
- `options`: Options currently limited to whether to use gridSpaces when measuring distance.

# `RulerSegment` class getters

`RulerSegment` uses a number of getters that could be modified by modules as necessary.

## `RulerSegment.prototype.defaultOptions`
Returns: { gridSpaces: true }

Sets the default options stored in `this.options`.

## `RulerSegment.prototype.distance`
Returns: {number} Distance of this segment.

Caches the segment distance value. If not yet defined or equal to 0, calls `RulerSegment.prototype.recalculateDistance.` Some modules may want to force a call to `recalculateDistance` for other reasons.

## `RulerSegment.prototype.text`
Returns {string} Segment label text.

Calls `Ruler.prototype._getSegmentLabel` to get the label text, providing the current segment distance, the total distance, and whether this is the last segment. Modules looking to modify the text label of a ruler should wrap this getter. 

## `RulerSegment.prototype.totalDistance`
Returns: {number} Distance of all prior segments plus this one.

Simply adds `RulerSegment.prototype.totalPriorDistance` + `RulerSegment.prototype.distance`.

## `RulerSegment.prototype.totalPriorDistance`
Returns: {number} Distance of all prior segments before this one.


# `RulerSegment` Class methods

## `RulerSegment.prototype.addProperties`
Parameters: None
Returns: None

Called by the constructor when a new `RulerSegment` is created. Meant to be used by modules to easily set parameters for every new segment.

## Recommended Use Case
Wrap to set properties, best added using the `RulerSegment` flag methods.

## Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/segments.js) sets various elevation-related properties for the segment, pulling in properties it previously set using flag on the parent ruler. 

## `RulerSegment.prototype.colorForPosition`
Parameters:
- {Object} position Object with x and y indicating the pixels at the grid position.

Returns: {Hex number} Hex color for the ruler at that position.

Default method simply returns `this.color`, which by default is equivalent to the parent ruler color property. Called by `RulerSegment.prototype.highlightPosition` to set the color at the position.

## Recommended Use Case
Change the highlight color of the ruler---for example, to signify range category or movement amount used.

## Examples
-  [Speed Ruler](https://github.com/caewok/fvtt-speed-ruler/blob/master/scripts/segment.js) sets the ruler highlight color based on the amount of movement (walk, dash, beyond) the token has available.

## `RulerSegment.prototype.constructPhysicalPath`
Parameters: 
- {object} destination_point Default: {x: this.ray.B.x, y: this.ray.B.y} 

Returns: { origin: { x: this.ray.A.x, y: this.ray.A.y }, destination: destination_point }

Called from `RulerSegment.prototype.measureDistance`. 

Construct a physical path for the segment that represents how the measured item actually would move within the segment. The constructed path is an object with an origin and destination. 

By convention, each point should have at least x and y. If 3d, it should have z. The returned physical path object may have other properties, but these may be ignored by other modules.

## Recommended Use Case
A module wishes to change how a ruler path represents actual movement in space. The ruler might display movement in 3-D (or other dimensions, like a Shadow or Ethereal dimension). Or it might display a parabolic arrow flight. 

## Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/segments.js) adds a `z` dimension representing the height at the origin and destination. 


## `RulerSegment.distanceFunction` (Static method)
Parameters: 
- {[{ray: Ray}]} segments An Array of measured movement segments. (1 in default implementation.) Each should be an object with the property "ray" containing a Ray. 

Returns: {number} Distance measured

Measure the distance of an array of segments, where each segment is a ray. 

## Recommended Use Case
Defining a different measurement method. For example, if you didn't like 5e's Euclidean measure, you could implement your own here.

## Examples
- [Manhattan Ruler](https://github.com/caewok/fvtt-manhattan-ruler/blob/main/scripts/segment.js) Overrides the distance measurement to use Manhattan distance (city blocks) instead.


## `RulerSegment.prototype.drawDistanceLabel`
Parameters: None
Return: {PreciseText} Text element that labels the measured path.

Mostly code from the portion of the base `Ruler.prototype.measure` that constructs the ruler label. Pulls the segment properties label, text, ray, and last and constructs a label object. Called from overridden `Ruler.prototype.measure` for each segment.

## Recommended Use Case
Creating a different or more complex label to display.

## Examples
None.

## `RulerSegment.prototype.drawEndpoints`
Parameters: None
Returns: None

Draws the end point indicators for the segment. Applies the opacityMultipliers.endpoint to adjust opacity. Only draws the origin point unless this is the last segment, in which case it draws the destination point. Called from overridden `Ruler.prototype.measure` for each segment.

## Recommended Use Case
Creating a different or more complex endpoint.

## Examples 
None.

## `RulerSegment.prototype.drawLine`
Parameters: None
Returns: None

Code from the portion of the base `Ruler.prototype.measure` that draws the highlighted measure line on the canvas. Called from overridden `Ruler.prototype.measure` for each segment.

## Recommended Use Case
Creating a different or more complex line.

## Examples
None.

## `RulerSegment.prototype.getFlag`
Same as `RulerSegment.prototype.getFlag` but flags are stored to the specific RulerSegment instantiation. 

## `RulerSegment.prototype.highlightMeasurement`
Parameters: 
- {Ray} Optional Ray. Kept for compatibility with original function. Defaults to `this.ray` for the segment.

Returns: None

Modified version of `Ruler.prototype._highlightMeasurement` applied to a single segment. This version calls `RulerSegment.highlightPosition`, allowing modules to wrap that method to change how highlighting works. Called from overridden `Ruler.prototype.measure` for each segment.

Note that this method uses the `RulerUtilities.iterateGridUnderLine` static generator to identify every grid position under the ruler, to pass to `highlightPosition`.

## Recommended Use Case
None. Most modules will likely wrap `highlightPosition` instead, or set color properties elsewhere.

## Examples
None.


## `RulerSegment.prototype.highlightPosition`
Parameters: 
- {Object} position Object with x, y indicating the pixels at the grid position.

Returns: None

Adds color (`RulerSegment.prototype.colorForPosition`) and alpha (`this.opacityMultipliers.highlight` property) to the position object before passing it to `canvas.grid.highlightPosition`.

## Recommended Use Case
Modifying highlighting of the ruler.

## Examples
None.


## `RulerSegment.prototype.measureDistance`
Parameters: 
- {PIXI.Point} destination_point

Returns: {number} Distance for the segment.

Measuring distance is done in three stages:
1. `RulerSegment.constructPhysicalPath`. A physical path is constructed, building up an array of points representing the path along the segment. By default, this physical path is comprised of two 2-D points: origin and destination of the segment. This path does not modify the ruler display but rather symbolizes how a token would actually move in space if one were to follow the ruler path.

2. `RulerSegment.measurePhysicalPath`. A distance calculator method is called to convert the physical path into a numeric value. If a module wraps (1), it likely will need to wrap (2) as well. 

3. `RulerSegment.modifyDistanceResult`. Modify the resulting distance number.

## Recommended Use Case
It is expected that most methods will not override this method but instead will wrap one or more of its sub-functions. 

## Examples
None.


## `RulerSegment.prototype.measurePhysicalPath`
Parameters: 
- {object} physical_path An object that contains {origin, destination}, each with at least {x, y}. 

Called from `RulerSegment.prototype.measureDistance`. Default parameters are the returned object from `RulerSegment.constructPhysicalPath`.

Conceptually, `measurePhysicalPath` does just that: it determines the distance of the physical path passed to it. The default version just measures from origin to destination using `RulerSegment.prototype.distanceFunction`. 

## Recommended Use Case
Modules defining alternative physical paths will probably need to wrap this to deal with their unique physical path definitions. Where possible, shrinking back to a 2-D origin/destination line is recommended for compatibility with other modules.

## Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/develop/scripts/segment.js), for example, wraps `RulerSegment.constructPhysicalPath` (1) to create a 3-D physical path by adding the z-dimension to each point. Elevation Ruler then wraps `RulerSegment.distanceFunction` (2) in order to project the 3-D path back onto the 2-D canvas, where the underlying distance measurement function takes over. 


## `RulerSegment.prototype.modifyDistanceResult`
Parameters: 
- {Number} measured_distance The distance measured for the physical path.
- {Object} physical_path  An object that contains {origin, destination}. Each has {x, y}.

Returns: {Number} The distance as modified.

The default version just returns the distance unmodified. Called from `RulerSegment.prototype.measureDistance` after the physical path is constructed and after the basic distance of that path is measured. 

## Recommended Use Case
Modify the calculated distance based on something other than actual measured distance. If you are just measuring the physical path, you probably want to modify `RulerSegment.prototype.measureDistance` or `RulerSegment.prototype.measurePhysicalPath`. 

## Examples
- [Terrain Ruler](https://github.com/caewok/foundryvtt-terrain-ruler/blob/libruler-basic/src/libruler_methods.js) wraps this to add multipliers for movement through difficult terrain.


## `RulerSegment.prototype.recalculateDistance`
Parameters: None
Returns: None

Sets the segment distanceValue property by executing `RulerSegment.prototype.measureDistance`.

## Recommended Use Case
Making related calculations every time distance is measured for a segment.

## Examples
None.

## `RulerSegment.prototype.setFlag`
Same as `RulerSegment.prototype.setFlag` but flags are stored to the specific RulerSegment instantiation. 

## `RulerSegment.prototype.traversePriorSegments`
Parameters: 
- {RulerSegment} segment Segment to traverse
- {string} prop Property or function to apply at each prior segment
- ...args Other arguments to pass to the function

Modules may use this method to traverse the links of prior segments. Note that in many cases, it is sufficient to set a flag and then update or read that flag from the immediate prior segment, negating the need for a full traversal. See `RulerSegment.prototype.addProperties`.

## Recommended Use Case
Applying a specialized function or retrieving a property for all prior segments

## Examples
None

## `RulerSegment.prototype.unsetFlag`
Same as `RulerSegment.prototype.unsetFlag` but flags are stored to the specific RulerSegment instantiation. 



