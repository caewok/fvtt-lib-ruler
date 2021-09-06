# FVTT libRuler
Library for [Foundry VTT](https://foundryvtt.com) which provides module developers with a means to modify the Ruler class in core Foundry VTT code, while reducing the likelihood of conflict with other modules. Also aims to make certain overrides of the Foundry ruler easier to accomplish.

<!--- Downloads @ Latest Badge -->
[![Version (latest)](https://img.shields.io/github/v/release/caewok/fvtt-lib-ruler)](https://github.com/caewok/fvtt-lib-ruler/releases/latest)
[![Foundry Version](https://img.shields.io/badge/dynamic/json.svg?url=https://github.com/caewok/fvtt-lib-ruler/releases/latest/download/module.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=blueviolet)](https://github.com/caewok/fvtt-lib-ruler/releases/latest)
[![License](https://img.shields.io/github/license/caewok/fvtt-lib-ruler)](LICENSE)

# Installation

Add this [Manifest URL](https://github.com/caewok/fvtt-lib-ruler/releases/latest/download/module.json) in Foundry to install.

## Dependencies

- [libWrapper Module](https://github.com/ruipin/fvtt-lib-wrapper)

## As a Module
1.  Copy this link and use it in Foundry's Module Manager to install the Module.

    > https://github.com/caewok/fvtt-lib-ruler/releases/latest/download/module.json

2.  Enable the Module in your World's Module Settings.

## As a Library
Your options parallel that of [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper#122-as-a-library). Those options are shamelessly copied and adapted here:
1. Adapt the shim provided by libWrapper [shim](#134-compatibility-shim).
<!--- May eventually want to provide our own --->

2. Write your own. **Please do not make your custom shim available in the global scope.**

3.  Trigger a different code path depending on whether libRuler is installed and active or not. For example:

    ```javascript
    Hooks.once('libRulerReady', async function() {
     // FLAG ANYTHING YOU NEED GIVEN THAT LIBRULER IS ACTIVE
    }
    
    // or 
    
    if(game.modules.get('libruler')?.active) {
     // DO LIB-RULER VERSION
    }
    
    ```

    or 


4.  Require your users to install this library. One simple example that achieves this is provided below. Reference the more complex example in the libWrapper [shim](https://github.com/ruipin/fvtt-lib-wrapper#135-compatibility-shim) if you prefer a dialog (including an option to dismiss it permanently) instead of a simple notification.

    ```javascript
    Hooks.once('ready', () => {
        if(!game.modules.get('libruler')?.active && game.user.isGM)
            ui.notifications.error("Module XYZ requires the 'libRuler' module. Please install and activate this dependency.");
    });
    ```

    Note that if you choose this option and require the user to install this library, you should make sure to list libRuler as a dependency. This can be done by adding the following to your package's manifest:

    ```javascript
    "dependencies": [
        {
            "name": "libruler"
        }
    ]
    ```

# Usage

libRuler overrides methods of and adds methods to the base Foundry Ruler Class. 



The libRuler module overrides two functions of the Ruler Class: `Ruler.prototype.measure` and `Ruler.prototype.moveToken.` In doing so, the libRuler module deprecates `Ruler.prototype._highlightMeasurement` in favor of a nearly identical version of that function in a new `RulerSegment` class. In order to track changed Ruler properties across users, libRuler wraps `Ruler.prototype.toJSON` and `Ruler.prototype.update`. All of these changes are implemented using the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) module.

## How to use libRuler

The expectation is that modules will use [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) to wrap one or more functions in the `RulerSegment` Class. The `RulerSegment` Class is exposed at `window.libRuler.RulerSegment` and can be wrapped similarly to wrapping core Foundry methods, for example:

```javascript
libWrapper.register(MODULE_ID, 'window.libRuler.RulerSegment.prototype.addProperties', [COOL FUNCTION HERE], 'WRAPPER');
 ```
 
[Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler) has several examples of wrapping libRuler functions.

## Changes to `Ruler.prototype.measure`

libRuler's version of `Ruler.prototype.measure`, at [measure.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-measure.js) now creates a `RulerSegment` representing the path between two waypoints (including origin or destination, as appropriate). The sequence of events remains the same, but events are now mostly handled by the `RulerSegment` Class. This permits modules to wrap or otherwise modify sub-parts of the Ruler measurement flow without having to re-write the entire measure method. The now-extensible parts, in the order encountered during measuring:
1. `Ruler.setDestination` is a new function that simply identifies and sets the `PIXI.Point` destination for the ruler.

For each segment in turn, from the origin outward:

2. A new `RulerSegment` is created. See `RulerSegment` Class below for more details.
3. `RulerSegment.drawLine` draws the ruler line on the canvas.
4. `RulerSegment.drawDistanceLabel` draws the text label indicating the ruler distance.
5. `RulerSegment.highlightMeasurement` highlights grid spaces on the canvas.
6. `RulerSegment.drawEndpoints` handles drawing the origin, destination, and waypoint indicators. 

## `RulerSegment` Class

Most modules will want to wrap functions for the [new `RulerSegment` Class](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/segment.js). A RulerSegment contains a link to the Ruler Class, a link to the prior segment in the chain, if any. Properties include:
- `prior_segment`: The previous `RulerSegment` or {} where this is the first segment originating from the measured start point.
- `segment_num`: Number of the segment, where 0 is the first segment originating from the measured start point.
- `ruler`: Ruler for this segment.
- `ray`: Ray representing the segment line.
- `label`: Ruler label corresponding to the segment.
- `color`: Color associated with the segment.
- `options`: Options currently limited to whether to use gridSpaces when measuring distance.

### `RulerSegment.constructRay` method

Method to create a Ray used to represent the ruler line on the canvas. 

### `RulerSegment.measureDistance` and how distance calculation works

One big change from the Foundry core is how libRuler permits modules to build upon one another for calculating distance. This is accomplished in the `RulerSegment.measureDistance` method. It is expected that most methods will not override this method but instead will wrap one or more of its sub-functions. 

Measuring distance is done in three stages. 
1. `RulerSegment.constructPhysicalPath`. A physical path is constructed, building up an array of points representing the path along the segment. By default, this physical path is comprised of two 2-D points: origin and destination of the segment. 
2. `RulerSegment.distanceFunction`. A distance calculator method is called to convert the physical path into a numeric value. If a module wraps (1), it likely will need to wrap (2) as well. 
3. `RulerSegment.getDistanceModifiers`. A set of modifier strings are applied to the numeric distance value. This typically should look like "+5" or "*2". An arbitrary number of modifiers can be applied, in the order they appear in the Array that stores them.

[Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/develop/scripts/segment.js), for example, wraps `RulerSegment.constructPhysicalPath` (1) to create a 3-D physical path by adding the z-dimension to each point. Elevation Ruler then wraps `RulerSegment.distanceFunction` (2) in order to project the 3-D path back onto the 2-D canvas, where the underlying distance measurement function takes over. 

### `RulerSegment.distance` getter and `RulerSegment.recalculateDistance` method

Probably need not be modified by modules; this retrieves the calculated distance of a segment, forcing a re-calculation if no value is yet present. Some modules may want to force a call to `recalculateDistance`.

### `RulerSegment.totalPriorDistance` and `RulerSegment.totalDistance` getters

`RulerSegment.totalPriorDistance` returns the calculated distance of the preceding RulerSegment; `Segment.totalDistance` adds in the distance of the current segment

### `RulerSegment.text` getter

Modules looking to modify the text label of a ruler should wrap this getter. 

### `RulerSegment.traversePriorSegments` helper method

Modules may use this method to traverse the links of prior segments. Note that in many cases, it is sufficient to set a flag and then update or read that flag from the immediate prior segment, negating the need for a full traversal. 

### `RulerSegment.addProperties` method and Segment Flags

The `RulerSegment` class adds the same `getFlag`, `setFlag`, `unsetFlag` used elsewhere in Foundry. This allows modules to add arbitrary properties to each segment without naming conflicts. When creating a new RulerSegment, the `constructor` method calls `RulerSegment.addProperties`, which gives modules a chance to add flags or do other tasks prior to distance calculation or drawing of the segment. 

### `RulerSegment.highlightMeasurement` and subfunctions `RulerSegment.highlightPosition` and `RulerSegment.colorForPosition`

libRuler moves `Ruler._highlightMeasurement` to the RulerSegment class. The underlying code is nearly the same. The primary change is that `RulerSegment.highlightPosition` is called, giving modules an opportunity to change how a give RulerSegment or sub-segment is highlighted on the canvas. This sub-function, in turn, calls `RulerSegment.colorForPosition`. Modules interested in changing highlighting or highlighted color should look here. 

## Changes to `Ruler.prototype.moveToken`

The code for moving a token using the ruler remains nearly the same as in core. Ruler Class gains a `testForCollision` method to confirm whether a collision has in fact occurred, and an `animateToken` method to actually do the token movement.

This allows [Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler/blob/develop/scripts/ruler.js), for example, to add elevation to the token as it is moved along the ruler path.

## Ruler Flags

libRuler adds the same `getFlag`, `setFlag`, `unsetFlag` used elsewhere in Foundry to the Ruler Class. This allows modules to add arbitrary properties to each Ruler without naming conflicts.
