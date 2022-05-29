/* globals

*/
"use strict";

import { log } from "../module.js";

/**
 * Use the drag ruler color when measuring from a token.
 * Requires knowing the draggedEntity (starting token when present)
 * See https://github.com/manuelVo/foundryvtt-drag-ruler/blob/445c03d29a9a9d9fa80f2bf72164428b463e0f86/js/ruler.js#L167
 * @param {Point} position  Position of the square to highlight
 * @return {HexString} color
 */
export function dragRulerSegmentColorForPosition(position) {
  log(`dragRulerSegmentColorForPosition at ${position.x},${position.y}`, this);

  // Determine if the ruler originated at a token
  const token = this.ruler._getMovementToken();
  if ( !token || !token.actor ) { return this.color; }

  log(`dragRulerSegmentColorForPosition|token ${token.id} at ${position.x},${position.y}`, token, this);

  // Don't apply colors if the current user doesn't have at least observer permissions
  // But if this is a pc and alwaysShowSpeedForPCs is enabled we show the color anyway
  if (token.actor.permission < 2
    && !(token.actor.data.type === "character" && game.settings.get("drag-ruler", "alwaysShowSpeedForPCs"))) {
    return this.color;
  }

  log(`dragRulerSegmentColorForPosition|totalPriorDistance ${this.totalPriorDistance}; new distance ${this.measureDistance(position)}`);

  let distance = this.totalPriorDistance + this.measureDistance(position);
  distance = Math.round(distance * 100) / 100;

  log(`dragRulerSegmentColorForPosition|distance ${distance}`);
  const out = dragRuler.getColorForDistanceAndToken(distance, token);

  log(`Drag Ruler returned color ${out}`, this);
  return out || this.color;
}