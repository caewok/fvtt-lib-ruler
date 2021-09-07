# FVTT libRuler
Library for [Foundry VTT](https://foundryvtt.com) which provides module developers with a means to modify the Ruler class in core Foundry VTT code, while reducing the likelihood of conflict with other modules. Also aims to make certain overrides of the Foundry ruler easier to accomplish.

<!--- Downloads @ Latest Badge -->
[![Version (latest)](https://img.shields.io/github/v/release/caewok/fvtt-lib-ruler)](https://github.com/caewok/fvtt-lib-ruler/releases/latest)
[![Foundry Version](https://img.shields.io/badge/dynamic/json.svg?url=https://github.com/caewok/fvtt-lib-ruler/releases/latest/download/module.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=blueviolet)](https://github.com/caewok/fvtt-lib-ruler/releases/latest)
[![License](https://img.shields.io/github/license/caewok/fvtt-lib-ruler)](LICENSE)

# User Installation

Add this [Manifest URL](https://github.com/caewok/fvtt-lib-ruler/releases/latest/download/module.json) in Foundry to install.

Enable the Module in your World's Module Settings. That's it! As a module library, there are no user-facing settings.

## Dependencies

- [libWrapper Module](https://github.com/ruipin/fvtt-lib-wrapper)

# Table of Contents
<!--- TOC created using ./Scripts/gh-md-toc -->
* [FVTT libRuler](#fvtt-libruler)
* [User Installation](#user-installation)
   * [Dependencies](#dependencies)
* [Table of Contents](#table-of-contents)
* [Developer Module Usage](#developer-module-usage)
   * [Use a compatibility shim](#use-a-compatibility-shim)
   * [Write your own custom shim](#write-your-own-custom-shim)
   * [Add switches based on whether libRuler is available](#add-switches-based-on-whether-libruler-is-available)
   * [Require libRuler as a dependency](#require-libruler-as-a-dependency)
* [Developer Usage](#developer-usage)
   * [Additional Documentation](#additional-documentation)
   * [How to use libRuler](#how-to-use-libruler)
   * [Changes to Ruler.prototype.measure](#changes-to-rulerprototypemeasure)
   * [RulerSegment class and measuring distance](#rulersegment-class-and-measuring-distance)
   * [Flow diagram of Ruler.prototype.measure](#flow-diagram-of-rulerprototypemeasure)
   * [Changes to Ruler.prototype.moveToken](#changes-to-rulerprototypemovetoken)
   * [Other changes to Ruler class](#other-changes-to-ruler-class)


# Developer Module Usage

Your options parallel that of [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper#122-as-a-library). Those options are shamelessly copied and adapted here:

## Use a compatibility shim
1. Adapt the shim provided by libWrapper [shim](#134-compatibility-shim).
<!--- May eventually want to provide our own --->

## Write your own custom shim
2. Write your own. **Please do not make your custom shim available in the global scope.**

## Add switches based on whether libRuler is available
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

## Require libRuler as a dependency
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

# Developer Usage

libRuler overrides methods of and adds methods to the base Foundry Ruler class. Use [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) to wrap functions needed by your module. Additional documentation describes the functions available:

## Additional Documentation
- [Ruler class overrides](https://github.com/caewok/fvtt-lib-ruler/blob/master/docs/RULER-CLASS-OVERRIDES.md). Ruler methods overriden by libRuler.
- [Ruler class additions](https://github.com/caewok/fvtt-lib-ruler/blob/master/docs/RULER-CLASS-ADDITIONS.md). Ruler methods added by libRuler.
- [RulerSegment class](https://github.com/caewok/fvtt-lib-ruler/blob/master/docs/RULERSEGMENT-CLASS.md). New class added by libRuler, representing the segment between two waypoints (including origin and destination as waypoints). Accessible at `window.libRuler.RulerSegment`.
- [Ruler Utilities](https://github.com/caewok/fvtt-lib-ruler/blob/master/docs/RULERUTILITIES-CLASS.md). Ruler utility methods added by libRuler. Accessible at `window.libRuler.RulerUtilities`.

Examples in the additional documentation sometimes point to branches of other modules. Specifically:
- Examples from [Drag Ruler](https://github.com/manuelVo/foundryvtt-drag-ruler) are currently from the [forked version](https://github.com/caewok/foundryvtt-drag-ruler/tree/caewok-libruler). 
- Examples from [Pathfinding Ruler](https://github.com/mothringer/foundry-vtt-pathfinding-ruler) are currently from the [forked version](https://github.com/caewok/foundry-vtt-pathfinding-ruler/tree/libruler)


## How to use libRuler

The expectation is that modules will use [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) to wrap one or more functions in the new `RulerSegment` class, the new methods added to the `Ruler` class, or (rarely) the underlying `Ruler` class methods. 

The `RulerSegment` Class is exposed at `window.libRuler.RulerSegment` and can be wrapped similarly to wrapping core Foundry methods, for example:

```javascript
libWrapper.register(MODULE_ID, 'window.libRuler.RulerSegment.prototype.addProperties', myCoolFunction, 'WRAPPER');
 ```
 
[Elevation Ruler](https://github.com/caewok/fvtt-elevation-ruler) has several examples of wrapping libRuler functions.

## Changes to `Ruler.prototype.measure`

libRuler's version of `Ruler.prototype.measure`, at [measure.js](https://github.com/caewok/fvtt-lib-ruler/blob/master/scripts/ruler-measure.js) now creates a `RulerSegment` representing the path between two waypoints (including origin or destination, as appropriate). The sequence of events remains the same, but events are now mostly handled by the `RulerSegment` Class. This permits modules to wrap or otherwise modify sub-parts of the Ruler measurement flow without having to re-write the entire measure method. 

## `RulerSegment` class and measuring distance

The [`RulerSegment` class](https://github.com/caewok/fvtt-lib-ruler/blob/master/docs/RULERSEGMENT-CLASS.md) class functions to represent segments of the ruler when measuring. The key function of `RulerSegment` is to break down measurement into three subparts: 
1. `RulerSegment.prototype.constructPhysicalPath`. 
2. `RulerSegment.prototype.measurePhysicalPath`. 
3. `RulerSegment.prototype.modifyDistanceResult`.

## Flow diagram of `Ruler.prototype.measure`
The full flow of `Ruler.prototype.measure` is as follows:

1. `Ruler.prototype.setDestination` allows modules to modify the destination point.

For each segment in turn, from the origin outward:

2. A new `RulerSegment` is created. 
3. `RulerSegment.prototype.drawLine` draws the ruler line on the canvas.
4. `RulerSegment.prototype.drawDistanceLabel` draws the text label indicating the ruler distance.
   
Distance label gets the current text, with the following:
  4.1. `RulerSegment.prototype.text` (getter)
      4.1.1. `RulerSegment.prototype.totalDistance` (getter)
        4.1.1.1 `RulerSegment.prototype.totalPriorDistance` (getter)
        4.1.1.2 `RulerSegment.prototype.distance` (getter)
      4.1.2. `RulerSegment.prototype.distance` (getter)

`RulerSegment.prototype.distance` is cached, but when calculated for the first time, it calls `RulerSegment.prototype.recalculateDistance`, which calls `RulerSegment.prototype.measureDistance`, which in turn calls:
- `RulerSegment.prototype.constructPhysicalPath`
- `RulerSegment.prototype.measurePhysicalPath`
  - `RulerSegment.prototype.distanceFunction` --> `canvas.grid.measureDistances`
- `RulerSegment.prototype.modifyDistanceResult`
      
5. `RulerSegment.prototype.highlightMeasurement` highlights grid spaces on the canvas.
  5.1 `RulerSegment.prototype.colorForPosition`
  5.2. `canvas.grid.highlightPosition`
6. `RulerSegment.prototype.drawEndpoints` handles drawing the origin, destination, and waypoint 


## Changes to `Ruler.prototype.moveToken`
`Ruler.prototype.moveToken` is broken up into parts, namely:
1. collision test to permit the movement
2. animating the token movement 

The full flow of `moveToken`:
1. Return if certain conditions met, such as the token is not available.
2. `Ruler.prototype.doDeferredMeasurements`
3. `Ruler.prototype.testForCollision`
4. For each ray (segment) of the ruler:
  - `Ruler.prototype.animateToken` --> calls `token.animateMovement`
5. `Ruler.prototype.endMeasurement`


## Other changes to `Ruler` class

'Ruler.prototype._highlightMeasurement' is deprecated, because its functionality is now part of `RulerSegment.prototype.highlightMeasurement`.

`Ruler.prototype._addWaypoint` and `Ruler.prototype._removeWaypoint` are overriden. `_addWaypoint` now takes an optional center parameter; if true it will apply `canvas.grid.getCenter` to the point. `_removeWaypoint` adds a `remeasure` option to trigger measurement when removing a waypoint (defaults to true).

'Ruler.prototype.toJSON' and 'Ruler.prototype.update' are wrapped to accommodate Ruler flags. 

Flags, which let modules store properties to the instantiated object, are added to `Ruler` and `RulerSegment` classes:
- `getFlag`
- `setFlag`
- `unsetFlag`

`Ruler.prototype._onMouseMove` gains several sub-methods to permit modules more control over when ruler measurements occur:
- `Ruler.prototype.scheduleMeasurement`
- `Ruler.prototype.deferMeasurement`
- `Ruler.prototype.cancelScheduledMeasurement`
- `Ruler.prototype.doDeferredMeasurements` (called from the overriden `Ruler.prototype.moveToken`)
