/* globals
getProperty,
setProperty
*/
"use strict";

import { log } from "./module.js";

// Flag methods for the Ruler class

/* -------------------------------------------- */
/**
 * Get the value of a "flag" for this Ruler or Segment.
 * Faster than the Foundry version but performs less checks.
 *
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @return {*}              The flag value
 */
export function libRulerGetFlag(scope, key) {
  key = `${scope}.${key}`;
  return getProperty(this.flags, key);

  // Use flags.scope?.key ??
}
/* -------------------------------------------- */
/**
 * Assign a "flag" to this Entity.
 * Flags represent key-value type data which can be used to store
 * flexible or arbitrary data required by modules using libRuler.
 * Flags can be set on Ruler or Segment instantiations.
 *
 * Flag values can assume almost any data type. Setting a flag value to null will delete
 * that flag. Typically you should do this using unsetFlag method.
 *
 * Performs less checks than the Foundry version.
 *
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @param {*} value         The flag value
 *
 * @return The updated object
 */

// Not async b/c we don't need to use this.update for Ruler class. (the Ruler is local to the client)
export function libRulerSetFlag(scope, key, value) {
  key = `flags.${scope}.${key}`;
  return setProperty(this, key, value);
}
/* -------------------------------------------- */
/**
 * Sets a flag assigned to the Entity to undefined.
 *
 * Performs less checks than the Foundry version.
 *
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @return The updated object
 */
// Not async b/c we don't need to use this.update for Ruler class. (the Ruler is local to the client)
export function libRulerUnsetFlag(scope, key) {
  key = `flags.${scope}.${key}`;
  return setProperty(this, key, undefined);
}


