"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TAG = tag;
exports.registerParser = registerParser;

var _main = require("./main.mjs");

var _lodash = _interopRequireDefault(require("lodash"));

var _odin = require("./parsers/odin.mjs");

var _brat = require("./parsers/brat.mjs");

var _odinson = require("./parsers/odinson.mjs");

/**
 * Instantiation and static functions
 */
// Parsers for the various annotation formats will be registered with the
// main library, and will be inherited by individual TAG instances.
var parsers = {
  odin: new _odin.OdinParser(),
  brat: new _brat.BratParser(),
  odinson: new _odinson.OdinsonParser()
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
 */

function tag(params) {
  // Core params
  if (!params.container) {
    throw "No TAG container element specified.";
  }

  if (!params.options) {
    params.options = {};
  }

  var instance = new _main.Main(params.container, params.options, parsers); // Initial data load

  if (params.data && params.format) {
    instance.loadData([params.data], params.format);
  }

  return instance;
}
/**
 * Registers the parser for a new annotation format.
 * @param {Object} parser - Parser object.
 * @param {String} format - Identifier for the annotation format
 *     associated with this parser.
 */


function registerParser(parser, format) {
  if (_lodash["default"].has(parsers, format)) {
    throw "There is already a Parser registered for the given format.";
  }

  parsers[format] = parser;
}