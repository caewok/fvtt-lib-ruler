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

