"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCssRules = getCssRules;
exports.sortForSlotting = sortForSlotting;
exports.difference = difference;

var _lodash = _interopRequireDefault(require("lodash"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// For some reason, the `draggable` import has to be in a different file
// from `main.mjs`.  This has something to do with the way ES6 imports work,
// and the fact that `svg.draggable.js` expects the `SVG` variable to be
// globally available.
// import { SVG } from '@svgdotjs/svg.js';
// import '@svgdotjs/svg.draggable.js';

/**
 * Get all the CSS rules that match the given elements
 * Adapted from:
 * https://stackoverflow.com/questions/2952667/find-all-css-rules-that-apply-to-an-element
 *
 * @param {Array} elements - Array of elements to get rules for
 * @return {Array}
 * @memberof module:Util
 */
function getCssRules(elements) {
  var sheets = document.styleSheets;
  var ret = [];
  var importRules = [];

  var _iterator = _createForOfIteratorHelper(sheets),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var sheet = _step.value;

      try {
        var rules = sheet.rules || sheets.cssRules;

        var _iterator2 = _createForOfIteratorHelper(rules),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var rule = _step2.value;

            // Include @import rules by default, since we can't be sure if they
            // apply, and since they are generally used for fonts
            if (rule.type === CSSRule.IMPORT_RULE) {
              importRules.push(rule.cssText);
              continue;
            } // For other types of rules, check against the listed elements


            var _iterator3 = _createForOfIteratorHelper(elements),
                _step3;

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var el = _step3.value;
                el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;

                if (el.matches(rule.selectorText)) {
                  ret.push(rule.cssText);
                  break;
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      } catch (err) {
        // Sometimes we get CORS errors with Chrome and external stylesheets,
        // but we should be all right to keep going
        console.log("Warning:", err);
      }
    } // Import rules have to be at the top of the styles list

  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return _lodash["default"].uniq(importRules.concat(ret));
}
/**
 * Sort some given array of Links in preparation for determining their slots
 * (vertical intervals for overlapping/crossing Links).  Needed because the
 * order that the Parser puts Links in might not be the order we actually want:
 *
 * 1) Primary sort by index of left endpoint, ascending
 * 2) Secondary sort by number of Words covered, descending
 *
 * @param links
 * @memberof module:Util
 */


function sortForSlotting(links) {
  var sortingArray = links.map(function (link, idx) {
    var endpoints = link.endpoints;
    return {
      idx: idx,
      leftAnchor: endpoints[0].idx,
      width: endpoints[1].idx - endpoints[0].idx + 1
    };
  }); // Sort by number of words covered, descending

  sortingArray.sort(function (a, b) {
    return b.width - a.width;
  }); // Sort by index of left endpoint, ascending

  sortingArray.sort(function (a, b) {
    return a.leftAnchor - b.leftAnchor;
  });
  return sortingArray.map(function (link) {
    return links[link.idx];
  });
}
/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */


function difference(object, base) {
  return (0, _lodash.transform)(object, function (result, value, key) {
    if (!(0, _lodash.isEqual)(value, base[key])) {
      result[key] = (0, _lodash.isObject)(value) && (0, _lodash.isObject)(base[key]) ? difference(value, base[key]) : value;
    }
  });
}