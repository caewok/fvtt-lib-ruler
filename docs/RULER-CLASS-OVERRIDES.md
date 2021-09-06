# libRuler Ruler Class Overrides

libRuler overrides certain methods of the Foundry Ruler class, described below. The methods are listed alphabetically (ignoring any underscore).


For underlying code, see 
- [ruler-measure.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-measure.js)
- [ruler-move-token.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-move-token.js)
- [patching.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/patching.js)

# Table of Contents
<!--- TOC created using ./Scripts/gh-md-toc -->

* [libRuler Overrides](#libruler-overrides)
   * [1. Ruler.prototype._addWaypoint (OVERRIDE)](#1-rulerprototype_addwaypoint-override)
      * [1.1. Recommended Use Case](#11-recommended-use-case)
      * [1.2. Examples](#12-examples)
   * [2. Ruler.prototype._highlightMeasurement (See RulerSegment.prototype.highlightMeasurement) (OVERRIDE)](#2-rulerprototype_highlightmeasurement-see-rulersegmentprototypehighlightmeasurement-override)
      * [2.1. Recommended Use Case](#21-recommended-use-case)
      * [2.2. Examples](#22-examples)
   * [3. Ruler.prototype.measure (OVERRIDE)](#3-rulerprototypemeasure-override)
      * [3.1. Recommended Use Case](#31-recommended-use-case)
      * [3.2. Examples](#32-examples)
   * [4. Ruler.prototype.moveToken (OVERRIDE)](#4-rulerprototypemovetoken-override)
      * [4.1. Recommended Use Case](#41-recommended-use-case)
      * [4.2. Examples](#42-examples)
   * [5. Ruler.prototype._onMouseMove (OVERRIDE)](#5-rulerprototype_onmousemove-override)
      * [5.1. Recommended Use Case](#51-recommended-use-case)
      * [5.2. Examples](#52-examples)
   * [6. Ruler.prototype._removeWaypoint (OVERRIDE)](#6-rulerprototype_removewaypoint-override)
      * [6.1. Recommended Use Case](#61-recommended-use-case)
      * [6.2. Examples](#62-examples)
   * [7. Ruler.prototype.toJSON (WRAPPER)](#7-rulerprototypetojson-wrapper)
      * [7.1. Recommended Use Case](#71-recommended-use-case)
      * [7.2. Examples](#72-examples)
   * [8. Ruler.prototype.update (WRAPPER)](#8-rulerprototypeupdate-wrapper)
      * [8.1. Recommended Use Case](#81-recommended-use-case)
      * [8.2. Examples](#82-examples)

## 1. `Ruler.prototype._addWaypoint` (OVERRIDE)
Parameters: 
- {PIXI.point} point 
- {Boolean} center = true

Returns: None

Adds an optional parameter `center=true`, to allow modules to determine whether a waypoint should be centered using `canvas.grid.getCenter`.

### 1.1. Recommended Use Case
Wrap this to know when waypoints are added to the ruler or to modify points that are added to the ruler.

### 1.2. Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) uses this to store the elevation changes made by the user when the waypoint is saved.
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) uses this to snap the ruler to the center of the dragged token.


## 2. `Ruler.prototype._highlightMeasurement` (OVERRIDE)
Parameters: 
- {Ray} ray

Returns: None

libRuler deprecates `Ruler.prototype._highlightMeasurement` because highlighting the canvas now happens at each RulerSegment (segment between waypoints). See [`RulerSegment.prototype.highlightMeasurement`](https://github.com/caewok/fvtt-lib-ruler/docs/RULERSEGMENT-CLASS.md). 

Calls to `Ruler.prototype._highlightMeasurement` will trigger a warning before being passed through to the Foundry version, with possibly unexpected outcomes.

### 2.1. Recommended Use Case
None.

### 2.2. Examples
None.


## 3. `Ruler.prototype.measure` (OVERRIDE)
Parameters:
- {PIXI.Point} destination
- {boolean} {gridSpaces=true}

Returns: {Array[{Ray}]} Measured segments

The bulk of libRuler's modifications to the Ruler Class are seen in `Ruler.prototype.measure`. The basic flow of `measure` is kept the same, but is broken down into components and sub-methods:
1. Preliminary
- [`Ruler.prototype.setDestination`](https://github.com/caewok/fvtt-lib-ruler/docs/RULER-CLASS-ADDITION.md)
- adding the destination to the waypoints array
- Clearing the highlight layer
- Clearing the ruler (`Ruler.prototype.clear`)

2. Create a [`RulerSegment`](https://github.com/caewok/fvtt-lib-ruler/docs/RULERSEGMENT-CLASS.md) representing each segment between two waypoints (considering origin and destination as waypoints). For each `RulerSegment`:
- Create the `RulerSegment`. 
- `RulerSegment.prototype.drawEndpoints`
- `RulerSegment.prototype.drawLine`
- `RulerSegment.prototype.drawDistanceLabel`
- `RulerSegment.prototype.highlightMeasurement`
- `RulerSegment.prototype.drawEndpoints`

### 3.1. Recommended Use Case
If you need to do something either every time a measurement starts or every time a measurement ends, wrap `Ruler.prototype.measure`. Most likely, you instead want to wrap some other method called by `measure`.

### 3.2. Examples
None at this time.


## 4. `Ruler.prototype.moveToken` (OVERRIDE)
Parameters: None
Returns: None

The code for moving a token using the ruler remains nearly the same as in core. Prior to token movement, `Ruler.prototype.doDeferredMeasurements` is called. (See discussion for `Ruler.prototype._onMouseMove` below.)

Ruler Class gains a `testForCollision` method to confirm whether a collision has in fact occurred, and an `animateToken` method to actually do the token movement. Once all animations are complete, `Ruler.prototype._endMeasurement` is called.

### 4.1. Recommended Use Case
Wrap if you want to do something before or after the token is moved. Otherwise, you probably want to wrap one or more of the newly added subfunctions, such as `animateToken`.

### 4.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) overrides this to intercept the spacebar or right-click, in order to add or delete waypoints according to the module settings.

## 5. `Ruler.prototype._onMouseMove` (OVERRIDE)
Parameters: 
- {Object} event

Returns: None

Takes the actual measurement portion of the original `_onMouseMove` and moves it to a new function, `Ruler.prototype.scheduleMeasurement`. Originally, Foundry would only do measurement updates on a mouse move if a specified amount of time had passed since the last measurement update. This test is now moved to `scheduleMeasurement`, which gives modules more options. 

If sufficient time has passed, `scheduleMeasurement` will do the measurement, and then call `Ruler.prototype.cancelScheduledMeasurement` to let modules know that the measurement has been done. If sufficient time has not passed, `scheduleMeasurement` will call `Ruler.prototype.deferMeasurement`, in case modules want to override this determination or do something else with the destination information. Ultimately, any deferred measurements are resolved by the libRuler version of `Ruler.prototype.moveToken`, which calls `Ruler.prototype.doDeferredMeasurements` before attempting to move a token.

### 5.1. Recommended Use Case 
Wrap `_onMouseMove` if you need to do something special when the user is moving the mouse to change the ruler measurement. Wrap the schedule measurement methods if you need more fine control over when ruler measurements occur.

### 5.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) wraps all of these to handle special conditions when dragging tokens.


## 6. `Ruler.prototype._removeWaypoint` (OVERRIDE)
Parameters: 
- {PIXI.point} point
- optional params:
  - {Boolean} {snap = true} 
  - {Boolean} {remeasure = true}

Returns: None

Adds an optional remeasure parameter that, if true, will call `Ruler.prototype.measure`. This is the default Foundry use. If false, measurement does not occur after removing the waypoint.

### 6.1. Recommended Use Case
Wrap this to know when waypoints are removed from the ruler. If you are setting waypoints automatically, you may want to disable measurement to avoid repeated measurements.

### 6.2. Examples
- Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) uses this to removed stored elevation changes.


## 7. `Ruler.prototype.toJSON` (WRAPPER)
Parameters: None
Returns: {Object} An object with properties class, name, waypoints, destination, _state. libRuler adds a flags property.

Mirror of `Ruler.prototype.update`. Adds any flags set by [`Ruler.prototype.setFlag`](https://github.com/caewok/fvtt-lib-ruler/docs/RULER-CLASS-ADDITION.md) to the JSON. The JSON is sent by Foundry over a socket to other users for viewing others' rulers as they are drawn on the map. 

### 7.1. Recommended Use Case
Wrap this if you are adding some special property to the Ruler object. But you may be better off just using [`Ruler.prototype.setFlag`](https://github.com/caewok/fvtt-lib-ruler/docs/RULER-CLASS-ADDITION.md) to set your property instead, so you don't have to worry about this!

### 7.2. Examples
None at this time.


## 8. `Ruler.prototype.update` (WRAPPER)
Parameters: 
- {Object} data

Returns: None

Mirror of `Ruler.prototype.toJSON`. Adds back to the data object any flags stored in the JSON data.

### 8.1. Recommended Use Case
Wrap this if you are adding some special property to the Ruler object. But you may be better off just using [`Ruler.prototype.setFlag`](https://github.com/caewok/fvtt-lib-ruler/docs/RULER-CLASS-ADDITION.md) to set your property instead, so you don't have to worry about this!

### 8.2. Examples
None at this time.

