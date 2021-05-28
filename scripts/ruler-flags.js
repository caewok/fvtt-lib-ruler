import { log } from "./module.js";

// Flag methods for the Ruler class
// Closely mimic PlaceableObject or other flag methods in Foundry.
  
/* -------------------------------------------- */
/**
 * Get the value of a "flag" for this PlaceableObject
 * See the setFlag method for more details on flags
 *
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @return {*}              The flag value
 */
export function libRulerGetFlag(scope, key) {
	const scopes = Game.getPackageScopes();
	if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
	key = `${scope}.${key}`;
	return getProperty(this.flags, key);
}
/* -------------------------------------------- */
/**
 * Assign a "flag" to this Entity.
 * Flags represent key-value type data which can be used to store flexible or arbitrary data required by either
 * the core software, game systems, or user-created modules.
 *
 * Each flag should be set using a scope which provides a namespace for the flag to help prevent collisions.
 *
 * Flags set by the core software use the "core" scope.
 * Flags set by game systems or modules should use the canonical name attribute for the module
 * Flags set by an individual world should "world" as the scope.
 *
 * Flag values can assume almost any data type. Setting a flag value to null will delete that flag. Typically you should do this using unsetFlag method
 *
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @param {*} value         The flag value
 *
 * @return {Promise}        A Promise resolving to the updated PlaceableObject
 */

// Not async b/c we don't need to use this.update for Ruler class. (the Ruler is local to the client)
export function libRulerSetFlag(scope, key, value) {
	const scopes = Game.getPackageScopes();
	if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
	key = `flags.${scope}.${key}`;
	return setProperty(this, key, value);
}
/* -------------------------------------------- */
/**
 * Remove a flag assigned to the Entity
 * @param {string} scope    The flag scope which namespaces the key
 * @param {string} key      The flag key
 * @return {Promise}        A Promise resolving to the updated Entity
 */
// Not async b/c we don't need to use this.update for Ruler class. (the Ruler is local to the client)
export function libRulerUnsetFlag(scope, key) {
	const scopes = Game.getPackageScopes();
	if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
	key = `flags.${scope}.-=${key}`;
	return setProperty(this, key, null);
}

/* 
 * Wrap the toJSON function to save flags.
 */
export function libRulerToJSON(wrapped, ...args) {
  log("Creating JSON!", this);
  
  let obj = wrapped(...args);
  obj.flags = this.flags;
  return obj;
}

/*
 * Wrap the update function to update flags.
 */
export function libRulerUpdate(wrapped, data) {
  log("We are updating!", this);
  
  // from Ruler.update
  if( data.class !== "Ruler" ) throw new Error("Unable to recreate Ruler instance from provided data.");
  
  // add in flags
  this.flags = data.flags;
  return wrapped(data);
}

