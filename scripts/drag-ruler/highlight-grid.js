/* globals

*/
"use strict";

import { log } from "../module.js";

/**
 * Use the drag ruler color when measuring from a token.
 * Requires knowing the draggedEntity (starting token when present)
 * @param {Point} position  Position of the square to highlight
 * @return {HexString} color
 */
export function dragRulerSegmentColorForPosition(position) {
  log(`dragRulerSegmentColorForPosition at ${position.x},${position.y}`, this);
  this.ruler.draggedEntity = this.ruler._getMovementToken();
  const out = Ruler.prototype.dragRulerGetColorForDistance.bind(this.ruler)(this.totalDistance);
  log(`Drag Ruler returned color ${out}`, this);
  return out;
}