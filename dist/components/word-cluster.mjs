"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WordCluster = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Act like WordTags for cases where multiple words make up a single entity
 * E.g.: The two words "DNA damage" as a single "BioProcess"
 *
 * Act as the anchor for any incoming Links (in lieu of the Words it covers)
 *
 *   WordTag -> Word -> Row
 *   [WordCluster]
 *   Link
 */
var WordCluster = /*#__PURE__*/function () {
  /**
   * Creates a new WordCluster instance
   * @param {Word[]} words - An array of the Words that this cluster will cover
   * @param {String} val - The raw text for this cluster's label
   */
  function WordCluster() {
    var _this = this;

    var words = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var val = arguments.length > 1 ? arguments[1] : undefined;
    (0, _classCallCheck2["default"])(this, WordCluster);
    this.eventIds = [];
    this.val = val;
    this.words = words;
    this.links = []; // SVG elements:
    //   2 groups for left & right brace, containing:
    //   a path appended to each of the two groups
    //   a text label appended to the left group
    // The SVG groups are children of the main SVG document rather than the
    // Word's SVG group, since WordClusters technically exceed the bounds of
    // their individual Words.

    this.svgs = [];
    this.lines = [];
    this.svgText = null; // The main API instance for the visualisation

    this.main = null; // Main Config object for the parent instance; set by `.init()`

    this.config = null; // Cached SVG BBox values

    this._textBbox = null;
    words.forEach(function (word) {
      return word.clusters.push(_this);
    });
  }
  /**
   * Any event IDs (essentially arbitrary labels) that this WordCluster is
   * associated with
   * @param id
   */


  (0, _createClass2["default"])(WordCluster, [{
    key: "addEventId",
    value: function addEventId(id) {
      if (this.eventIds.indexOf(id) < 0) {
        this.eventIds.push(id);
      }
    }
    /**
     * Sets the text of this WordCluster, or returns this WordCluster's SVG text
     * element
     * @param val
     * @return {*}
     */

  }, {
    key: "text",
    value: function text(val) {
      if (val === undefined) {
        return this.svgText;
      }

      this.val = val;
      this.svgText.text(this.val);
      this._textBbox = this.svgText.bbox();

      if (this.editingRect) {
        var bbox = this.svgText.bbox();

        if (bbox.width > 0) {
          this.editingRect.width(bbox.width + 8).height(bbox.height + 4).x(bbox.x - 4).y(bbox.y - 2);
        } else {
          this.editingRect.width(10).x(this.svgText.x() - 5);
        }
      }
    }
    /**
     * Initialise this WordCluster against the main API instance.
     * Will be called once each by every Word within this cluster's coverage,
     * but we are really only interested in the first Word and the last Word
     * @param {Word} word - A Word within this cluster's coverage.
     * @param main
     */

  }, {
    key: "init",
    value: function init(word, main) {
      var _this2 = this;

      var idx = this.endpoints.indexOf(word);

      if (idx < 0) {
        // Not a critical word
        return;
      }

      this.main = main;
      this.config = main.config; // A critical Word.  Prepare the corresponding SVG group.

      var mainSvg = main.svg;

      if (!this.svgs[idx]) {
        var svg = this.svgs[idx] = mainSvg.group().addClass("tag-element").addClass("word-cluster");
        this.lines[idx] = svg.path().addClass("tag-element"); // Add the text label to the left arm

        if (idx === 0) {
          this.svgText = svg.text(this.val).leading(1);
          this._textBbox = this.svgText.bbox();

          this.svgText.node.oncontextmenu = function (e) {
            e.preventDefault();
            mainSvg.fire("tag-right-click", {
              object: _this2,
              event: e
            });
          };

          this.svgText.click(function () {
            return mainSvg.fire("tag-edit", {
              object: _this2
            });
          });
        }
      } // Perform initial draw if both arms are ready


      if (this.lines[1] && this.endpoints[1].row) {
        this.draw();
      }
    }
    /**
     * Draws in the SVG elements for this WordCluster
     * https://codepen.io/explosion/pen/YGApwd
     */

  }, {
    key: "draw",
    value: function draw() {
      var _this3 = this;

      if (!this.lines[1] || !this.endpoints[1].row) {
        // The Word/WordClusters are not ready for drawing
        return;
      }
      /** @type {Word} */


      var leftAnchor = this.endpoints[0];
      /** @type {Word} */

      var rightAnchor = this.endpoints[1];
      var leftX = leftAnchor.x;
      var rightX = rightAnchor.x + rightAnchor.boxWidth;

      if (leftAnchor.row === rightAnchor.row) {
        // Draw in full curly brace between anchors
        var baseY = this.getBaseY(leftAnchor.row);
        var textY = baseY - this.config.wordTopTagPadding - this._textBbox.height;
        var centre = (leftX + rightX) / 2;
        this.svgText.move(centre, textY);
        this._textBbox = this.svgText.bbox(); // Each arm consists of two curves with relatively tight control
        // points (to preserve the "hook-iness" of the curve).
        // The following x-/y- values are all relative.

        var armWidth = (rightX - leftX) / 2;
        var curveWidth = armWidth / 2;
        var curveControl = Math.min(curveWidth, this.config.linkCurveWidth);
        var curveY = -this.config.wordTopTagPadding / 2; // Left arm

        this.lines[0].plot("M" + [leftX, baseY] + "c" + [0, curveY, curveControl, curveY, curveWidth, curveY] + "c" + [curveWidth - curveControl, 0, curveWidth, 0, curveWidth, curveY]); // Right arm

        this.lines[1].plot("M" + [rightX, baseY] + "c" + [0, curveY, -curveControl, curveY, -curveWidth, curveY] + "c" + [-curveWidth + curveControl, 0, -curveWidth, 0, -curveWidth, curveY]);
      } else {
        // Extend curly brace to end of first Row, draw intervening rows,
        // finish on last Row
        var _textY = leftAnchor.row.baseline - leftAnchor.boxHeight - this._textBbox.height - this.config.wordTopTagPadding;

        var _centre = (leftX + leftAnchor.row.rw) / 2;

        this.svgText.move(_centre, _textY);
        this._textBbox = this.svgText.bbox(); // Left arm

        var leftY = this.getBaseY(leftAnchor.row);

        var _armWidth = (leftAnchor.row.rw - leftX) / 2;

        var _curveWidth = _armWidth / 2;

        var _curveControl = Math.min(_curveWidth, this.config.linkCurveWidth);

        var _curveY = -this.config.wordTopTagPadding / 2;

        this.lines[0].plot("M" + [leftX, leftY] + "c" + [0, _curveY, _curveControl, _curveY, _curveWidth, _curveY] + "c" + [_curveWidth - _curveControl, 0, _curveWidth, 0, _curveWidth, _curveY]); // Right arm, first Row

        var d = "";
        d += "M" + [leftAnchor.row.rw, leftY + _curveY] + "c" + [-_armWidth + _curveControl, 0, -_armWidth, 0, -_armWidth, _curveY]; // Intervening rows

        for (var i = leftAnchor.row.idx + 1; i < rightAnchor.row.idx; i++) {
          var thisRow = this.main.rowManager.rows[i];
          var lineY = this.getBaseY(thisRow);
          d += "M" + [0, lineY + _curveY] + "L" + [thisRow.rw, lineY + _curveY];
        } // Last Row


        var rightY = this.getBaseY(rightAnchor.row);
        d += "M" + [rightX, rightY] + "c" + [0, _curveY, -_curveControl, _curveY, -rightX, _curveY];
        this.lines[1].plot(d); // // draw right side of brace extending to end of row and align text
        // let center = (-left + this.endpoints[0].row.rw) / 2 + 10;
        // this.x = center + lOffset;
        // this.svgText.x(center + lOffset);
        //
        // this.lines[0].plot("M" + lOffset
        //   + ",33c0,-10," + [center, 0, center, -8]
        //   + "c0,10," + [center, 0, center, 8]
        // );
        // this.lines[1].plot("M" + rOffset
        //   + ",33c0,-10," + [-right + 8, 0, -right + 8, -8]
        //   + "c0,10," + [-right + 8, 0, -right + 8, 8]
        // );
      } // propagate draw command to parent links


      this.links.forEach(function (l) {
        return l.draw(_this3);
      });
    }
    /**
     * Calculates what the absolute y-value for the base of this cluster's curly
     * brace should be if it were drawn on the given Row
     * @param row
     */

  }, {
    key: "getBaseY",
    value: function getBaseY(row) {
      // Use the taller of the endpoint's boxes as the base
      var wordHeight = Math.max(this.endpoints[0].boxHeight, this.endpoints[1].boxHeight);
      return row.baseline - wordHeight;
    }
  }, {
    key: "remove",
    value: function remove() {
      var _this4 = this;

      this.svgs.forEach(function (svg) {
        return svg.remove();
      });
      this.words.forEach(function (word) {
        var i = word.clusters.indexOf(_this4);

        if (i > -1) {
          word.clusters.splice(i, 1);
        }
      });
    }
  }, {
    key: "listenForEdit",
    value: function listenForEdit() {
      this.isEditing = true;
      var bbox = this.svgText.bbox();
      this.svgs[0].addClass("tag-element").addClass("editing");
      this.editingRect = this.svgs[0].rect(bbox.width + 8, bbox.height + 4).x(bbox.x - 4).y(bbox.y - 2).rx(2).ry(2).back();
    }
  }, {
    key: "stopEditing",
    value: function stopEditing() {
      this.isEditing = false;
      this.svgs[0].removeClass("editing");
      this.editingRect.remove();
      this.editingRect = null;
      this.val = this.val.trim();

      if (!this.val) {
        this.remove();
      }
    }
    /**
     * Returns an array of the first and last Words covered by this WordCluster
     * @return {Word[]}
     */

  }, {
    key: "endpoints",
    get: function get() {
      return [this.words[0], this.words[this.words.length - 1]];
    }
  }, {
    key: "row",
    get: function get() {
      return this.endpoints[0].row;
    }
    /**
     * Returns the absolute y-position of the top of the WordCluster's label
     * (for positioning Links that point at it)
     * @return {Number}
     */

  }, {
    key: "absoluteY",
    get: function get() {
      // The text label lives with the left arm of the curly brace
      var thisHeight = this.svgs[0].bbox().height;
      return this.endpoints[0].absoluteY - thisHeight;
    }
    /**
     * Returns the height of this WordCluster, from Row baseline to the top of
     * its label
     */

  }, {
    key: "fullHeight",
    get: function get() {
      // The text label lives with the left arm of the curly brace
      var thisHeight = this.svgs[0].bbox().height;
      return this.endpoints[0].boxHeight + thisHeight;
    }
  }, {
    key: "idx",
    get: function get() {
      return this.endpoints[0].idx;
    }
    /**
     * Returns the x-position of the centre of this WordCluster's label
     * @return {*}
     */

  }, {
    key: "cx",
    get: function get() {
      return this._textBbox.cx;
    }
    /**
     * Returns the width of the bounding box of the WordTag's SVG text element
     * @return {Number}
     */

  }, {
    key: "textWidth",
    get: function get() {
      return this._textBbox.width;
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Debug functions

    /**
     * Draws the outline of this component's bounding box
     */

  }, {
    key: "drawBbox",
    value: function drawBbox() {
      var bbox = this.svgs[0].bbox();
      this.svgs[0].polyline([[bbox.x, bbox.y], [bbox.x2, bbox.y], [bbox.x2, bbox.y2], [bbox.x, bbox.y2], [bbox.x, bbox.y]]).fill("none").stroke({
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
      this.svgs[0].polyline([[bbox.x, bbox.y], [bbox.x2, bbox.y], [bbox.x2, bbox.y2], [bbox.x, bbox.y2], [bbox.x, bbox.y]]).fill("none").stroke({
        width: 1
      });
    }
  }]);
  return WordCluster;
}();

exports.WordCluster = WordCluster;