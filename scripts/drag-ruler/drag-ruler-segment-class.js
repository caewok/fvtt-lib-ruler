/* globals
game,
dragRuler,
canvas
*/
"use strict";

/*
Changes to LibRulerSegment to incorporate Drag Ruler
*/

import { log } from "../module.js";
import { LibRulerSegment } from "../segment.js";

// Dangerous!
import { Line } from "../../../drag-ruler/js/geometry.js";
import { getGridPositionFromPixels, getPixelsFromGridPosition } from "../../../drag-ruler/js/foundry_fixes.js";
import { getSnapPointForToken, getTokenShape, getAreaFromPositionAndShape } from "../../../drag-ruler/js/util.js";

export class DragRulerSegment extends LibRulerSegment {

  /**
   * @wrap
   * Set color based on token speed when available.
   * Both when using drag ruler and when using regular ruler.
   */
  colorForPosition(position) {
    const color = super.colorForPosition(position);

    // Determine if the ruler originated at a token
    const token = this.ruler._getMovementToken();
    if ( !token || !token.actor ) { return color; }

    // Don't apply colors if the current user doesn't have at least observer permissions
    // But if this is a pc and alwaysShowSpeedForPCs is enabled we show the color anyway
    if (token.actor.permission < 2
      && !(token.actor.data.type === "character" && game.settings.get("drag-ruler", "alwaysShowSpeedForPCs"))) {
      return color;
    }

    let distance = this.totalPriorDistance + this.measureDistance(position);
    distance = Math.round(distance * 100) / 100;
    return dragRuler.getColorForDistanceAndToken(distance, token) || color;
  }

  /**
   * @wrap
   * Adjust distance label when token is present
   */
  drawDistanceLabel() {
    const label = super.drawDistanceLabel();
    if ( !this.ruler.isDragRuler || !label ) return label;

    log("drawDistanceLabel", this, label);
    const ray = this.ray;

    // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/foundry_imports.js#L288
    let labelPosition = {x: ray.x0, y: ray.y0};
    labelPosition.x -= label.width / 2;
    labelPosition.y -= label.height / 2;
    const rayLine = Line.fromPoints(ray.A, ray.B);
    const rayLabelXHitY = rayLine.calcY(labelPosition.x);
    let innerDistance;
    // If ray hits top or bottom side of label
    if (rayLine.isVertical || rayLabelXHitY < labelPosition.y || rayLabelXHitY > labelPosition.y + label.height) {
      innerDistance = Math.abs((label.height / 2) / Math.sin(ray.angle));
    // If ray hits left or right side of label
    } else {
      innerDistance = Math.abs((label.width / 2) / Math.cos(ray.angle));
    }

    labelPosition = ray.project((ray.distance + 50 + innerDistance) / ray.distance);
    labelPosition.x -= label.width / 2;
    labelPosition.y -= label.height / 2;
    label.position.set(labelPosition.x, labelPosition.y);

    return label;
  }

  /**
   * @wrap
   * Adjust the highlight position for snapping.
   * @param {Point} position    Point for row/col of grid from canvas.grid.grid.getPixelsFromGridPosition
   */
  highlightPosition(position) {
    const token = this.ruler.dragRulerToken();
    if (!token || !this.ruler.isDragRuler ) return super.highlightPosition(position);

    log(`highlightPosition|Adjusting highlight for token at position ${position.x},${position.y}`, token, this);

    // From https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/foundry_imports.js#L349
    const [xg, yg] = canvas.grid.grid.getCenter(position.x, position.y);
    const snapPoint = getSnapPointForToken(...canvas.grid.getTopLeft(xg, yg), token);
    const [snapX, snapY] = getGridPositionFromPixels(snapPoint.x + 1, snapPoint.y + 1);

    const shape = token ? getTokenShape(token) : [{x: 0, y: 0}];
    const area = getAreaFromPositionAndShape({ x: snapX, y: snapY }, shape);
    for ( const space of area ) {
      const [x, y] = getPixelsFromGridPosition(space.x, space.y);
      super.highlightPosition({x, y});
    }
  }

}

