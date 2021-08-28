## 0.1.5
Override `Ruler.prototype._removeWaypoint` to add an option to skip the re-measurement after the waypoint is removed. Helpful for modules like [Pathfinding Ruler](https://github.com/mothringer/foundry-vtt-pathfinding-ruler) that do automatic waypoint creation and deletion.

## 0.1.4
Override `Ruler.prototype._onMouseMove` in order to add the ability for modules to schedule and defer measurements. (See Drag Ruler module for an example of this.) Adds related methods:
- `Ruler.prototype.scheduleMeasurement`
- `Ruler.prototype.deferMeasurement`
- `Ruler.prototype.cancelScheduledMeasurement`
- `Ruler.doDeferredMeasurements` (called within `Ruler.moveToken`)

Fix `Ruler.prototype.unsetFlag` method, which was not correctly removing properties. Instead, `unsetFlag` will now set the flag property to undefined.

Override `Ruler.prototype._addWaypoint` so that points to be added can be adjusted by other modules (such as Drag Ruler).

Add a property `opacityMultipliers` to `RulerSegment` class. This permits modules to easily modify the opacity of ruler lines, endpoints, and highlighting. 

## 0.1.3
Resolve issue #3 (Set prior destination before updating the token movement).

## 0.1.2
Possibly breaking: Switch to a static RulerSegment.distanceFunction so that modules can easily call the function outside of a RulerSegment object. 
Update devMode call to avoid repeated warnings. 

## 0.1.1
Improvements to Ruler.moveToken and Ruler.animateToken to more closely correspond with Foundry changes in the 0.8 series. Unlikely to be a breaking change, but Ruler.animateToken now returns the prior destination for Ruler.moveToken to track to deal with edge cases where the token has been moved by other means.

## 0.1.0
Switch to using RulerSegment as the class name, to avoid collisions with other Segment classes. Change the physical path method to create an array of points in two or three dimensions. Break the measurement function into two parts: one to project the physical path onto the 2-D canvas, and a second to do the actual measurement of path line segments. Added physical_path as an argument to modifyDistanceResult. 

Add a RulerUtilities class with static methods that can be accessed at `window.libRuler.RulerUtilities`:
- `almostEqual` for testing near equality.
- `pointsAlmostEqual`.
- `calculateDistance` method for measuring points distance, allowing for near equality.
- `iterateGridUnderLine` generator to walk along the grid underneath a line segment.

Breaking changes:
- Renamed `Segment` class to `RulerSegment`
- Renamed `distanceFunction` to `measurePhysicalPath`. Broke out `distanceFunction` as a function called by `measurePhysicalPath`.    
- Use a more generic `options` parameter for the `RulerSegment` class.


## 0.0.9
Update Module ID in code to match that of the module.json. 

## 0.0.8
Update the module.json to use a name without special characters to conform to Foundry requirements.

## 0.0.7
Store an option that is passed to measureDistance options. Minor cleanup of hook functions.

## 0.0.6
Fix for failure to incorporate changes from 0.0.5 into release.

## 0.0.5
Incorporate changes suggested by Stäbchenfisch. 
- Simplify flag functions to prioritize speed over checks.
- Use an object with origin and destination for the physical path.
- Simplify `measureDistance` by using a `modifyResult` function to allow 
    modifications such as for terrain penalties.
- Detour `Ruler._highlightMeasurement` into `Segment.highlightMeasurement`.

## 0.0.4
Update to Foundry 0.8.5.
- Update flag functions to call game.getPackageScopes.
- Incorporate changes to how moving the token works under the new Document structure.
- Incorporate other updates from 0.8.5.
- Add a README.md.

## 0.0.3
Bug fixes when testing module interactions.
- Switch to a chained approach to prior segments. Each segment points to the previous segment in the ruler.
- Add a helper function to traverse the segment chain.
- Fix bug with total distance calculation.

## 0.0.2
Switch to using a Segment Class for most measure functionality.
- Single loop in Ruler.measure to iterate over the segments.
- Drawing and distance measure handled by Segment Class.
- Add Segment Class to window['libRuler'].
- 3-step distance measure:
  1. Construct a physical path of "movement" by creating Array of points. 
  2. Use defined measurement function to measure the Array of points.
  3. Add modifiers to the distance number.


## 0.0.1
Add functionality for overriding Ruler.moveToken.
- Add method to test for collisions when moving the token.
- Add method to animate the token along the ruler.

Basic testing suggests the library is functional and works with Elevation Ruler.

## 0.0.1-alpha3

Basic functionality for overriding Ruler.measure.

- Add methods to store flags.
- Add method to set the destination point when measuring.
- Add methods to construct a distance and highlight ray for each segment.
- Add method to modify measure segments after creation.
- Add methods to draw the various components of the segments.

