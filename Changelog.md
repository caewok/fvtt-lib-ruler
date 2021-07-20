## 0.1.0
Switch to using RulerSegment as the class name, to avoid collisions with other Segment classes. 

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

