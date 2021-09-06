# libRuler Ruler Class Additions
libRuler adds certain methods to the Foundry Ruler class, described below. The methods are listed alphabetically (ignoring any underscore).

libRuler also adds a RulerSegment Class and associated methods, [documented separately](https://github.com/caewok/fvtt-lib-ruler/docs/RULERSEGMENT-CLASS.md).

- Examples from [Drag Ruler](https://github.com/manuelVo/foundryvtt-drag-ruler) are currently from the [forked version](https://github.com/caewok/foundryvtt-drag-ruler/tree/caewok-libruler). 
- Examples from [Pathfinding Ruler](https://github.com/mothringer/foundry-vtt-pathfinding-ruler) are currently from the [forked version](https://github.com/caewok/foundry-vtt-pathfinding-ruler/tree/libruler)

For underlying code, see 
- [ruler-measure.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-measure.js)
- [ruler-move-token.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-move-token.js)
- [patching.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/patching.js)

# Table of Contents
<!--- TOC created using ./Scripts/gh-md-toc -->
* [libRuler Ruler Class Additions](#libruler-ruler-class-additions)
* [Table of Contents](#table-of-contents)
* [Overview](#overview)
   * [1. Ruler.prototype.animateToken](#1-rulerprototypeanimatetoken)
      * [1.1. Recommended Use Case](#11-recommended-use-case)
      * [1.2. Examples](#12-examples)
   * [2. Ruler.prototype.cancelScheduledMeasurement](#2-rulerprototypecancelscheduledmeasurement)
      * [2.1. Recommended Use Case](#21-recommended-use-case)
      * [2.2. Examples](#22-examples)
   * [3. Ruler.prototype.deferMeasurement](#3-rulerprototypedefermeasurement)
      * [3.1. Recommended Use Case](#31-recommended-use-case)
      * [3.2. Examples](#32-examples)
   * [4. Ruler.prototype.doDeferredMeasurement](#4-rulerprototypedodeferredmeasurement)
      * [4.1. Recommended Use Case](#41-recommended-use-case)
      * [4.2. Examples](#42-examples)
   * [5. Ruler.prototype.getFlag](#5-rulerprototypegetflag)
      * [5.1. Recommended Use Case](#51-recommended-use-case)
      * [5.2. Examples](#52-examples)
   * [6. Ruler.prototype.scheduleMeasurement](#6-rulerprototypeschedulemeasurement)
      * [6.1. Recommended Use Case](#61-recommended-use-case)
      * [6.2. Examples](#62-examples)
   * [7. Ruler.prototype.setDestination](#7-rulerprototypesetdestination)
      * [7.1. Recommended Use Case](#71-recommended-use-case)
      * [7.2. Examples](#72-examples)
   * [8. Ruler.prototype.setFlag](#8-rulerprototypesetflag)
      * [8.1 Recommended Use Case](#81-recommended-use-case)
      * [8.2 Examples](#82-examples)
   * [9. Ruler.prototype.testForCollision](#9-rulerprototypetestforcollision)
      * [9.1. Recommended Use Case](#91-recommended-use-case)
      * [9.2. Examples](#92-examples)
   * [10. Ruler.prototype.unsetFlag](#10-rulerprototypeunsetflag)
      * [10.1 Recommended Use Case](#101-recommended-use-case)
      * [10.2 Examples](#102-examples)


# Overview

libRuler adds a set of methods to create, retrieve, and remove flags: `Ruler.prototype.getFlag`, `Ruler.prototype.setFlag`, `Ruler.prototype.unsetFlag`. These methods are similar to, but lighter-weight than, the Foundry flag methods found in other classes. libRuler takes care of ensuring that rulers synced between users also sync these flags. 

The overriden `Ruler.prototype.measure` method calls `Ruler.prototype.setDestination` before doing a measurement. 

The overriden `Ruler.prototype.moveToken` method calls `Ruler.prototype.testForCollision` prior to moving the token. `moveToken` then calls `Ruler.prototype.animateToken` for each segment (waypoint to waypoint) of movement.

The overriden `Ruler.prototype._onMouseMove` method calls `Ruler.prototype.scheduleMeasurement`. That method, in turn, either does a measurement and then calls `Ruler.prototype.cancelScheduledMeasurement`, or calls `Ruler.prototype.deferMeasurement`. Whenever `Ruler.prototype.moveToken` is called, it first calls `Ruler.prototype.doDeferredMeasurement` before doing a measurement. 


## 1. `Ruler.prototype.animateToken`
Parameters: 
- {Token} token The token that is being animated.
- {Ray} ray The ray indicating the segment that should be moved.
- {number} dx Offset in x direction relative to the Token top-left.
- {number} dy Offset in y direction relative to the Token top-left.
- {integer} segment_num The segment number, where 1 is the first segment between origin and the first waypoint (or destination).

Returns:
- {x: Number, y: Number} The prior destination

`Ruler.prototype.animateToken` is called from the overriden`Ruler.prototype.moveToken`. It actually copies quite a bit of code from the original `moveToken`---the part where the token movement is actually committed and `token.animateMovement`  is called. 

### 1.1. Recommended Use Case
Any time you need to know when the token movement has started or stopped, this is the method to wrap.  

### 1.2. Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) wraps `animateToken` to adjust the token elevation when moving.


## 2. `Ruler.prototype.cancelScheduledMeasurement`
Parameters: None
Returns: None

Empty function meant for modules to wrap if they need to do something when a mouse move results in a measurement. See the overriden `Ruler.prototype._onMouseMove` method.

See also:
- `Ruler.prototype.deferMeasurement`
- `Ruler.prototype.doDeferredMeasurement`
- `Ruler.prototype.scheduleMeasurement`

### 2.1. Recommended Use Case
Use if your module needs fine-grained tracking of when a measurement occurs versus when it is deferred ("scheduled").

### 2.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) uses this to clear its deferred measurements. (See [foundry_imports.js](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/foundry_imports.js).)


## 3. `Ruler.prototype.deferMeasurement`
Parameters: 
- {PIXI.Point} destination
- {Object} event

Returns: None

Empty function meant for modules to wrap if they need to do something when a mouse move does not result in a measurement. See the overriden `Ruler.prototype._onMouseMove` method. 

See also:
- `Ruler.prototype.cancelScheduledMeasurement`
- `Ruler.prototype.doDeferredMeasurement`
- `Ruler.prototype.scheduleMeasurement`

### 3.1. Recommended Use Case
Use if your module needs fine-grained tracking of when a measurement occurs versus when it is deferred ("scheduled").

### 3.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) uses this to set a deferred measurement. (See [foundry_imports.js](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/foundry_imports.js).)

## 4. `Ruler.prototype.doDeferredMeasurement`
Parameters: None
Returns: {Promise} Resolves to true.

Empty function meant for modules to wrap if they need to do something at the beginning of a token move, after the initial checks are complete and we are committed to moving the token. See the overriden `Ruler.prototype._onMouseMove` and `Ruler.prototype.moveToken` methods.

See also:
- `Ruler.prototype.cancelScheduledMeasurement`
- `Ruler.prototype.deferMeasurement`
- `Ruler.prototype.scheduleMeasurement`
 
### 4.1. Recommended Use Case
Use to do prep work prior to the user triggering the ruler to do a token move. Also consider wrapping `Ruler.prototype.animateToken` if you need more specific segment-by-segment move data.

### 4.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) uses this to run its deferred measurement.


## 5. `Ruler.prototype.getFlag`
Parameters:
- {string} scope Namespace for the key. Should be unique to the module. Traditionally the module name. 
- {string} key 

Returns: The value of the flag for the provided scope and key.

Comparable to the Foundry base version used elsewhere, but more performant because it has fewer checks and does not need to use `update`. 

See also:
- `Ruler.prototype.setFlag`
- `Ruler.prototype.unsetFlag`

### 5.1. Recommended Use Case
Anytime you need to define a module-specific parameter for a specific ruler instantiation.

### 5.2. Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) tracks elevation increments using flags.


## 6. `Ruler.prototype.scheduleMeasurement`
Parameters: 
- {PIXI.Point} destination
- {Object} event

Returns: None

Pulls out the last portion of the base `Ruler.prototype._onMouseMove`—--the part that tests whether sufficient time has passed since the last measurement. 

See also:
- `Ruler.prototype.cancelScheduledMeasurement`
- `Ruler.prototype.deferMeasurement`
- `Ruler.prototype.doDeferredMeasurement`

### 6.1. Recommended Use Case
Changing the precise measurement interval between measurements. Changing something else about the event data when you have destination information.

### 6.2. Examples
None at this time. But the related methods are wrapped by [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js).


## 7. `Ruler.prototype.setDestination`
Parameters: 
- {PIXI.Point} destination

Returns: None

Called at the beginning of the overriden `Ruler.prototype.measure`. The libRuler version simply creates a centered point from the provided destination and sets that to the ruler destination property. 

### 7.1. Recommended Use Case
Changing the destination immediately prior to measurement.

### 7.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) uses a snap point based on the specific token to define the destination.

## 8. `Ruler.prototype.setFlag`
Parameters:
- {string} scope Namespace for the key. Should be unique to the module. Traditionally the module name. 
- {string} key 
- {*} value

Returns: The result of the call to `setProperty`.

Comparable to the Foundry base version used elsewhere, but more performant because it has fewer checks and does not need to use `update`. libRuler wraps `Ruler.prototype.update` and `Ruler.prototype.toJSON` to ensure flags are included. If you define properties outside of these flags, you will need to wrap these functions as well. 

See also:
- `Ruler.prototype.getFlag`
- `Ruler.prototype.unsetFlag`

### 8.1 Recommended Use Case
Defining a module-specific parameter for a specific ruler instantiation.

### 8.2 Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) tracks elevation increments using flags.


## 9. `Ruler.prototype.testForCollision`
Parameters:
- {Ray[]} rays Represents the segments between waypoints of the ruler.

Returns: {boolean} true if a collision will occur (which will cancel the measurement with a displayed error)

`Ruler.prototype.animateToken` and `Ruler.prototype.testForCollision` are both called from the overriden`Ruler.prototype.moveToken`. The libRuler `testForCollision` is the same as the base Foundry code, which returns true if `canvas.walls.checkCollision` returns true for one or more rays.

### 9.1. Recommended Use Case
Providing a more nuanced test for collisions when using the ruler. 

### 9.2. Examples
- [Drag Ruler](https://github.com/caewok/foundryvtt-drag-ruler/blob/caewok-libruler/src/libruler.js) overrides this if the GM is using Drag Ruler to drag a token, so that the GM can drag tokens through walls.


## 10. `Ruler.prototype.unsetFlag`
Parameters:
- {string} scope Namespace for the key. Should be unique to the module. Traditionally the module name. 
- {string} key 

Returns: The result of the call to `setProperty`.

Comparable to the Foundry base version used elsewhere, but more performant because it has fewer checks and does not need to use `update`. Note that unset only sets the property to undefined; it does not remove the property key entirely.

See also:
- `Ruler.prototype.getFlag`
- `Ruler.prototype.setFlag`

### 10.1 Recommended Use Case
Defining a module-specific parameter for a specific ruler instantiation.

### 10.2 Examples
- [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/master/scripts/ruler.js) tracks elevation increments using flags. 

