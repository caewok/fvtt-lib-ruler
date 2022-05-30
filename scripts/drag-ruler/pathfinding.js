/* globals
dragRuler
*/
"use strict";

import { libRulerAddWaypoint, libRulerMeasure } from "../ruler-measure.js";

export function dragRulerAddWaypoint(point, options = {}) {
  // To avoid using libWrapper for this
  libRulerAddWaypoint.call(this, point, options);
  this.waypoints.filter(waypoint => waypoint.isPathfinding).forEach(waypoint => waypoint.isPathfinding = false);
}

export function dragRulerMeasure(destination, options) {
  // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/foundry_imports.js#L174

  const token = this.ruler._getMovementToken();
  const isToken = token instanceof Token;

  this.dragRulerRemovePathfindingWaypoints();

  if ( isToken && isPathfindingEnabled.call(this) ) {
    const from = getGridPositionFromPixelsObj(this.waypoints[this.waypoints.length - 1]);
		const to = getGridPositionFromPixelsObj(destination);
		let path = findPath(from, to, this.draggedEntity, this.waypoints);
		if (path)
			path.shift();
		if (path && path.length > 0) {
			path = path.map(point => getSnapPointForTokenObj(getPixelsFromGridPositionObj(point), this.draggedEntity));

			// If the token is snapped to the grid, the first point of the path is already handled by the ruler
			if (path[0].x === this.waypoints[this.waypoints.length - 1].x && path[0].y === this.waypoints[this.waypoints.length - 1].y)
				path = path.slice(1);

			// If snapping is enabled, the last point of the path is already handled by the ruler
			if (options.snap)
				path = path.slice(0, path.length - 1);

			for (const point of path) {
				point.isPathfinding = true;
				this.labels.addChild(new PreciseText("", CONFIG.canvasTextStyle));
			}
			this.waypoints = this.waypoints.concat(path);
		}
		else {
			// Don't show a path if the pathfinding yields no result to show the user that the destination is unreachable
			destination = this.waypoints[this.waypoints.length - 1];
		}

  }


  // To avoid using libWrapper for this
  libRulerMeasure.call(this, destination, options)

}