/**
 * Instantiation and static functions
 */
import { Main } from "./main.mjs";
import _ from "lodash";

import { OdinParser } from "./parsers/odin.mjs";
import { BratParser } from "./parsers/brat.mjs";
import { OdinsonParser } from "./parsers/odinson.mjs";

// Parsers for the various annotation formats will be registered with the
// main library, and will be inherited by individual TAG instances.
const parsers = {
  odin: new OdinParser(),
  brat: new BratParser(),
  odinson: new OdinsonParser()
};

/**
 * Initialises a TAG visualisation on the given element.
 * @param {Object} params - Initialisation parameters.
 * @param {String|Element|jQuery} params.container - Either a string
 *     containing the ID of the container element, or the element itself (as a
 *     native/jQuery object).
 * @param {Object} [params.data] - Initial data to load, if any.
 * @param {String} [params.format] - One of the supported format identifiers for
 *     the data.
 * @param {Object} [params.options] - Overrides for various default
 *     library options.
* @param {Object} [params.parsers] - mapping of format -> parser
 */
function tag(params) {
  // Core params
  if (!params.container) {
    throw "No TAG container element specified.";
  }

  if (!params.options) {
    params.options = {};
  }

  if (!params.parsers) {
    params.parsers = parser;
  }

  const instance = new Main(params.container, params.options, params.parsers = parsers);

  // Initial data load
  if (params.data && params.format) {
    instance.loadData([params.data], params.format);
  }
  return instance;
}

export {
  tag as TAG
};
