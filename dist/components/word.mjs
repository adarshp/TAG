"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Word = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _wordTag = require("./word-tag.mjs");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// import { SVG } from '@svgdotjs/svg.js';
// import '@svgdotjs/svg.draggable.js';
var Word = /*#__PURE__*/function () {
  /**
   * Creates a new Word instance
   * @param {String} text - The raw text for this Word
   * @param {Number} idx - The index of this Word within the
   *     currently-parsed document
   */
  function Word(token) {
    (0, _classCallCheck2["default"])(this, Word);
    var text = token.text,
        idx = token.idx;
    this.text = text;
    this.idx = idx;
    this.token = token; // Optional properties that may be set later
    // -----------------------------------------

    this.eventIds = [];
    this.registeredTags = {};
    this.topTagCategories = [];
    this.bottomTagCategories = [];
    this.bottomTags = {};
    this.topTags = {}; // Back-references that will be set when this Word is used in
    // other structures
    // ---------------------------------------------------------
    // WordTag

    this.topTag = null; // WordCluster

    this.clusters = []; // Link

    this.links = []; // Row

    this.row = null; // Links that pass over this Word (even if this Word is not an endpoint
    // for the Link) -- Used for Link/Row slot calculations

    this.passingLinks = []; // SVG-related properties
    // ----------------------

    this.initialised = false; // Main API instance

    this.main = null; // Main Config object for the parent instance

    this.config = null; // SVG group containing this Word and its attendant WordTags

    this.svg = null; // The x-position of the left bound of the Word's box

    this.x = 0; // Calculate the SVG BBox only once per transformation (it's expensive)

    this._bbox = null;
    this._textBbox = null;
  }
  /**
   * Any event IDs (essentially arbitrary labels) that this Word is
   * associated with
   * @param id
   */


  (0, _createClass2["default"])(Word, [{
    key: "addEventId",
    value: function addEventId(id) {
      if (this.eventIds.indexOf(id) < 0) {
        this.eventIds.push(id);
      }
    }
    /**
     * Register a tag for this word under the given category.
     * At run-time, one category of tags can be shown above this Word and
     * another can be shown below it.
     * @param {String} category
     * @param {String} tag
     */

  }, {
    key: "registerTag",
    value: function registerTag() {
      var category = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";
      var tag = arguments.length > 1 ? arguments[1] : undefined;
      this.registeredTags[category] = tag;
    }
    /**
     * Returns all the unique tag categories currently registered for this Word
     */

  }, {
    key: "getTagCategories",
    value: function getTagCategories() {
      return Object.keys(this.registeredTags);
    }
    /**
     * Sets the top tag category for this Word, redrawing it if it is initialised
     * @param {String} category
     */

  }, {
    key: "setTopTagCategory",
    value: function setTopTagCategory(category) {
      if (!this.registeredTags[category]) {
        return;
      }

      if (this.topTagCategories.indexOf(category) >= 0) {
        this.removeTopTagCategory(category);
        return;
      }

      if (this.initialised) {
        var displayTag = category in this.registeredTags ? this.registeredTags[category] : "-";
        var topTagKey = "".concat(category, "-").concat(displayTag.val);
        this.topTags[topTagKey] = new _wordTag.WordTag(displayTag, this, this.config, true, true, this.bottomTagCategories.length); // Since one of the Word's tags has changed, recalculate/realign its
        // bounding box

        this.alignBox();
      }

      this.topTagCategories.push(category);
    }
  }, {
    key: "removeTopTagCategory",
    value: function removeTopTagCategory(category) {
      var displayTag = category in this.registeredTags ? this.registeredTags[category] : "-";
      var topTagKey = "".concat(category, "-").concat(displayTag.val);
      var topTagKeys = Object.keys(this.topTags);

      if (topTagKeys.length > 1) {
        var tag = this.topTags[topTagKey];

        if (tag) {
          tag.remove();
        }

        delete this.topTags[topTagKey];

        this._redrawTopTags();

        this.alignBox();
        this.topTagCategories = this.topTagCategories.filter(function (topCategory) {
          return topCategory !== category;
        });
      }
    }
  }, {
    key: "_redrawTopTags",
    value: function _redrawTopTags() {
      var _this = this;

      var currentDisplayedTags = Object.keys(this.topTags);
      currentDisplayedTags.forEach(function (topTagKey, i) {
        var currentWordTag = _this.topTags[topTagKey];

        if (currentWordTag !== null) {
          currentWordTag.layerIndex = i;
          currentWordTag.draw();
        }
      });
      this.alignBox();
    }
  }, {
    key: "_redrawBottomTags",
    value: function _redrawBottomTags() {
      var _this2 = this;

      var currentDisplayedTags = Object.keys(this.bottomTags);
      currentDisplayedTags.forEach(function (bottomTagKey, i) {
        var currentWordTag = _this2.bottomTags[bottomTagKey];

        if (currentWordTag !== null) {
          currentWordTag.layerIndex = i;
          currentWordTag.draw();
        }
      });
      this.alignBox();
    }
    /**
     * Sets the bottom tag category for this Word, redrawing it if it is
     * initialised
     * @param {String} category
     */

  }, {
    key: "setBottomTagCategory",
    value: function setBottomTagCategory(category) {
      if (!this.registeredTags[category]) {
        return;
      }

      if (this.bottomTagCategories.indexOf(category) >= 0) {
        this.removeBottomTagCategory(category);
        return;
      }

      if (this.initialised) {
        var displayTag = category in this.registeredTags ? this.registeredTags[category] : "-";
        var bottomTagKey = "".concat(category, "-").concat(displayTag.val);
        this.bottomTags[bottomTagKey] = new _wordTag.WordTag(displayTag, this, this.config, false, true, this.bottomTagCategories.length); // Since one of the Word's tags has changed, recalculate/realign its
        // bounding box

        this.alignBox();
      }

      this.bottomTagCategories.push(category);
    }
  }, {
    key: "removeBottomTagCategory",
    value: function removeBottomTagCategory(category) {
      var displayTag = category in this.registeredTags ? this.registeredTags[category] : "-";
      var bottomTagKey = "".concat(category, "-").concat(displayTag.val);
      var bottomTagKeys = Object.keys(this.bottomTags);

      if (bottomTagKeys.length > 1) {
        var tag = this.bottomTags[bottomTagKey];

        if (tag) {
          tag.remove();
        }

        delete this.bottomTags[bottomTagKey];

        this._redrawBottomTags();

        this.alignBox();
        this.bottomTagCategories = this.bottomTagCategories.filter(function (bottomCategory) {
          return bottomCategory !== category;
        });
      }
    }
    /**
     * Initialises the SVG elements related to this Word, and performs an
     * initial draw of it and its WordTags.
     * The Word will be drawn in the top left corner of the canvas, but will
     * be properly positioned when added to a Row.
     * @param main - The main API instance
     */

  }, {
    key: "init",
    value: function init(main) {
      var _this3 = this;

      this.main = main;
      this.config = main.config;
      var mainSvg = main.svg;
      this.svg = mainSvg.group().addClass("tag-element").addClass("word"); // Draw main word text.  We remove the default additional leading
      // (basically vertical line-height padding) so that we can position it
      // more precisely.

      this.svgText = this.svg.text(this.text).addClass("tag-element").addClass("word-text").leading(1); // The positioning anchor for the text element is its centre, so we need
      // to translate the entire Word rightward by half its width.
      // In addition, the x/y-position points at the upper-left corner of the
      // Word's bounding box, but since we are working relative to the Row's
      // main line, we need to move the Word upwards so that the lower-left
      // corner meets the Row.
      // The desired final outcome is for the Text element's bbox to have an
      // x-value of 0 and a y2-value of 0.

      var currentBox = this.svgText.bbox();
      this.svgText.move(-currentBox.x, -currentBox.height);
      this._textBbox = this.svgText.bbox(); // ------------------------
      // Draw in this Word's tags

      if (this.topTagCategories.length) {
        this.topTagCategories.forEach(function (category, i) {
          var displayTag = category in _this3.registeredTags ? _this3.registeredTags[category] : "-";
          var topTagKey = "".concat(category, "-").concat(displayTag.val);
          _this3.topTags[topTagKey] = new _wordTag.WordTag(displayTag, _this3, _this3.config, true, true, i);
        });
      } else {
        var topTagKey = "empty";
        this.topTags[topTagKey] = null;
      }

      if (this.bottomTagCategories.length) {
        this.bottomTagCategories.forEach(function (category, i) {
          var displayTag = category in _this3.registeredTags ? _this3.registeredTags[category] : "-";
          var bottomTagKey = "".concat(category, "-").concat(displayTag.val);
          _this3.bottomTags[bottomTagKey] = new _wordTag.WordTag(displayTag, _this3, _this3.config, false, true, i);
        });
      } // Draw cluster info


      this.clusters.forEach(function (cluster) {
        cluster.init(_this3, main);
      }); // Ensure that all the SVG elements for this Word and any WordTags are
      // well-positioned within the Word's bounding box, and set the cached
      // values this._textBbox and this._bbox

      this.alignBox(); // ---------------------
      // Attach drag listeners

      var x = 0;
      var mousemove = false;
      this.svgText.draggable().on("dragstart", function (e) {
        mousemove = false;
        x = e.detail.p.x;
        mainSvg.fire("word-move-start");
      }).on("dragmove", function (e) {
        e.preventDefault();
        var dx = e.detail.p.x - x;
        x = e.detail.p.x;
        mainSvg.fire("word-move", {
          object: _this3,
          x: dx
        });

        if (dx !== 0) {
          mousemove = true;
        }
      }).on("dragend", function () {
        mainSvg.fire("word-move-end", {
          object: _this3,
          clicked: mousemove === false
        });
      }); // attach right click listener

      this.svgText.off("dblclick").dblclick(function (e) {
        return mainSvg.fire("build-tree", {
          object: _this3,
          event: e
        });
      });

      this.svgText.node.oncontextmenu = function (e) {
        e.preventDefault();
        mainSvg.fire("word-right-click", {
          object: _this3,
          event: e
        });
      };

      this.initialised = true;
    }
    /**
     * Redraw Links
     */

  }, {
    key: "redrawLinks",
    value: function redrawLinks() {
      var _this4 = this;

      this.links.forEach(function (l) {
        return l.draw(_this4);
      });
      this.redrawClusters();
    }
    /**
     * Redraw all clusters (they should always be visible)
     */

  }, {
    key: "redrawClusters",
    value: function redrawClusters() {
      var _this5 = this;

      this.clusters.forEach(function (cluster) {
        if (cluster.endpoints.indexOf(_this5) > -1) {
          cluster.draw();
        }
      });
    }
    /**
     * Sets the base x-position of this Word and its attendant SVG elements
     * (including its WordTags)
     * @param x
     */

  }, {
    key: "move",
    value: function move(x) {
      this.x = x;
      this.svg.transform({
        x: this.x
      });
      this.redrawLinks();
    }
    /**
     * Moves the base x-position of this Word and its attendant SVG elements
     * by the given amount
     * @param x
     */

  }, {
    key: "dx",
    value: function dx(x) {
      this.move(this.x + x);
    }
    /**
     * Aligns the elements of this Word and any attendant WordTags such that
     * the entire Word's bounding box has an x-value of 0, and an x2-value
     * equal to its width
     */

  }, {
    key: "alignBox",
    value: function alignBox() {
      var _this6 = this;

      // We begin by resetting the position of the Text elements of this Word
      // and any WordTags, so that consecutive calls to `.alignBox()` don't
      // push them further and further away from their starting point
      this.svgText.attr({
        x: 0,
        y: 0
      });
      var currentBox = this.svgText.bbox();
      this.svgText.move(-currentBox.x, -currentBox.height);
      this._textBbox = this.svgText.bbox();
      var currentDisplayedTopTags = Object.keys(this.topTags);

      if (currentDisplayedTopTags.length > 0) {
        currentDisplayedTopTags.forEach(function (displayedTag) {
          var tag = _this6.topTags[displayedTag];

          if (tag) {
            tag.centre();
          }
        });
      }

      var currentDisplayedBottomTags = Object.keys(this.bottomTags);

      if (currentDisplayedBottomTags.length > 0) {
        currentDisplayedBottomTags.forEach(function (displayedTag) {
          _this6.bottomTags[displayedTag].centre();
        });
      } // Generally, we will only need to move things around if the WordTags
      // are wider than the Word, which gives the Word's bounding box a
      // negative x-value.


      this._bbox = this.svg.bbox();
      var diff = -this._bbox.x;

      if (diff <= 0) {
        return;
      } // We can't apply the `.x()` translation directly to this Word's SVG
      // group, or it will simply set a transformation on the group (leaving
      // the bounding box unchanged).  We need to move all its children
      // (recursively) instead.


      function childrenDx(parent, diff) {
        var _iterator = _createForOfIteratorHelper(parent.children()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var child = _step.value;

            if (child.children && child.children()) {
              childrenDx(child, diff);
            } else {
              child.dx(diff);
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      childrenDx(this.svg, diff); // And update the cached values

      this._bbox = this.svg.bbox();
    }
    /**
     * Returns the width of the bounding box for this Word and its WordTags.
     * @return {Number}
     */

  }, {
    key: "boxWidth",
    get: function get() {
      return this._bbox.width;
    }
    /**
     * Returns the minimum width needed to hold this Word and its WordTags.
     * Differs from boxWidth in that it will also reserve space for the Word's
     * WordClusters if necessary (even though the WordClusters are not
     * technically part of the Word's box)
     */

  }, {
    key: "minWidth",
    get: function get() {
      // The Word's Bbox covers the Word and its WordTags
      var minWidth = this.boxWidth;

      var _iterator2 = _createForOfIteratorHelper(this.clusters),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var cluster = _step2.value;

          var _cluster$endpoints = (0, _slicedToArray2["default"])(cluster.endpoints, 2),
              clusterLeft = _cluster$endpoints[0],
              clusterRight = _cluster$endpoints[1];

          if (clusterLeft.row !== clusterRight.row) {
            // Let's presume that if the Rows are different, the Cluster has
            // enough space (this probably isn't true, but can be revisited later)
            continue;
          }

          var wordWidth = cluster.endpoints[1].x + cluster.endpoints[1].boxWidth - cluster.endpoints[0].x;
          var labelWidth = cluster.svgText.bbox().width;

          if (labelWidth > wordWidth) {
            // The WordCluster's label is wider than the Words it comprises; add
            // a bit of extra width to this Word
            minWidth = Math.max(minWidth, labelWidth / cluster.words.length);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return minWidth;
    }
    /**
     * Returns the extent of the bounding box for this Word above the Row's line
     * @return {Number}
     */

  }, {
    key: "boxHeight",
    get: function get() {
      // Since the Word's box is relative to the Row's line to begin with,
      // this is simply the negative of the y-value of the box
      return -this._bbox.y;
    }
    /**
     * Returns the extent of the bounding box for this Word below the Row's line
     * @return {Number}
     */

  }, {
    key: "descendHeight",
    get: function get() {
      // Since the Word's box is relative to the Row's line to begin with,
      // this is simply the y2-value of the box
      return this._bbox.y2;
    }
    /**
     * Returns the absolute y-position of the top of this Word's bounding box
     * @return {Number}
     */

  }, {
    key: "absoluteY",
    get: function get() {
      return this.row ? this.row.baseline - this.boxHeight : this.boxHeight;
    }
    /**
     * Returns the absolute y-position of the bottom of this Word's bounding box
     * @return {Number}
     */

  }, {
    key: "absoluteDescent",
    get: function get() {
      return this.row ? this.row.ry + this.row.rh + this.descendHeight : this.descendHeight;
    }
    /**
     * Returns the absolute x-position of the centre of this Word's box
     * @return {Number}
     */

  }, {
    key: "cx",
    get: function get() {
      return this.x + this.boxWidth / 2;
    }
    /**
     * Returns the width of the bounding box of the Word's SVG text element
     * @return {Number}
     */

  }, {
    key: "textWidth",
    get: function get() {
      return this._textBbox.width;
    }
    /**
     * Returns the height of the bounding box of the Word's SVG text element
     * @return {Number}
     */

  }, {
    key: "textHeight",
    get: function get() {
      return this._textBbox.height;
    }
    /**
     * Returns the *relative* x-position of the centre of the bounding
     * box of the Word's SVG text element
     */

  }, {
    key: "textRcx",
    get: function get() {
      return this._textBbox.cx;
    }
    /**
     * Returns true if this Word contains a single punctuation character
     *
     * FIXME: doesn't handle fancier unicode punctuation | should exclude
     * left-punctuation e.g. left-paren or left-quote
     * @return {Boolean}
     */

  }, {
    key: "isPunct",
    get: function get() {
      return this.text.length === 1 && this.text.charCodeAt(0) < 65;
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Debug functions

    /**
     * Draws the outline of this component's bounding box
     */

  }, {
    key: "drawBbox",
    value: function drawBbox() {
      var bbox = this.svg.bbox();
      this.svg.polyline([[bbox.x, bbox.y], [bbox.x2, bbox.y], [bbox.x2, bbox.y2], [bbox.x, bbox.y2], [bbox.x, bbox.y]]).fill("none").stroke({
        width: 1
      });
    }
    /**
     * Draws the outline of the text element's bounding box
     */

  }, {
    key: "drawTextBbox",
    value: function drawTextBbox() {
      var bbox = this.svgText.bbox();
      this.svg.polyline([[bbox.x, bbox.y], [bbox.x2, bbox.y], [bbox.x2, bbox.y2], [bbox.x, bbox.y2], [bbox.x, bbox.y]]).fill("none").stroke({
        width: 1
      });
    }
  }]);
  return Word;
}();

exports.Word = Word;