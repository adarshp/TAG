"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WordTag = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Tags for single entities/tokens.
 * Essentially a helper class for Words; should not be directly instantiated
 * by Parsers.
 *
 *   [WordTag] -> Word -> Row
 *   WordCluster
 *   Link
 */
var WordTag = /*#__PURE__*/function () {
  /**
   * Creates a new WordTag instance
   * @param {String} val - The raw text for this WordTag
   * @param {Word} word - The parent Word for this WordTag
   * @param {Config~Config} config - The Config object for the parent TAG
   *   instance
   * @param {Boolean} top - True if this WordTag should be drawn above the
   *     parent Word, false if it should be drawn below
   */
  function WordTag(tag, word, config) {
    var top = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var multiLayer = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var layerIndex = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    (0, _classCallCheck2["default"])(this, WordTag);
    this.tag = tag;
    this.val = this.tag.val;
    this.word = word;
    this.config = config;
    this.top = top;
    this.multiLayer = multiLayer !== false;
    this.layerIndex = layerIndex;

    if (!word.svg) {
      throw "Error: Trying to initialise WordTag on Word without SVG" + " element";
    }

    this.draw();
  }
  /**
   * (Re-)draws this WordTag's SVG elements onto the visualisation
   */


  (0, _createClass2["default"])(WordTag, [{
    key: "draw",
    value: function draw() {
      var _this = this;

      if (this.svg) {
        // Delete remnants of any previous draw
        this.remove();
      } // Prepare our SVG elements as a group within the Word's SVG element


      this.svg = this.word.svg.group(); // Draw in the SVG text element.
      // Note that applying classes to the text element may change its font
      // size, and if its font size changes, the anchor point for the resizing
      // is the text's baseline (not any of the bounding box sides).
      // N.B.: Typographical baselines ignore descenders

      this.svgText = this.svg.text(this.val).addClass("tag-element").addClass(this.top ? "word-tag" : "word-tag syntax-tag").leading(1); // add click and right-click listeners

      var mainSvg = this.word.main.svg;

      this.svgText.node.oncontextmenu = function (e) {
        e.preventDefault();
        mainSvg.fire("tag-right-click", {
          object: _this,
          event: e
        });
      };

      this.svgText.click(function () {
        return mainSvg.fire("tag-edit", {
          object: _this
        });
      }); // Draws a line / curly bracket between the Word and this WordTag, if
      // it's a top tag

      this.line = this.svg.path().addClass("tag-element");
      this.drawTagLine(); // Centre the WordTag and its line horizontally
      // (SVG text elements are positioned on the x-axis by their centres)

      this.centre(); // Position the WordTag above/below the main Word
      // (It starts with its upper-left corner on the Row's baseline)

      var newY;

      if (this.top) {
        newY = -this.word.textHeight - this.svgText.bbox().height - this.config.wordTopTagPadding - this.config.multiTagLayerPadding * this.layerIndex;
      } else {
        if (!this.multiLayer) {
          newY = this.config.wordBottomTagPadding;
        } else {
          newY = this.config.wordBottomTagPadding + this.config.multiTagLayerPadding * this.layerIndex;
        }
      }

      this.svgText.y(newY);
      this.line.cy((this.svgText.bbox().y2 + this.word.svgText.bbox().y) / 2);
    }
    /**
     * Centres this WordTag and its line horizontally against the base Word's
     * current position
     * (N.B.: SVG Text elements are positioned on the x-axis by their centres)
     */

  }, {
    key: "centre",
    value: function centre() {
      // Centre the Text element
      this.svgText.x(this.word.textRcx); // Centre the line between the Word and WordTag

      this.line.cx(this.svgText.cx());
    }
    /**
     * Removes this WordTag's SVG elements from the visualisation
     * If this instance is not deleted, it can be redrawn with the `.draw()`
     * method
     * @return {*}
     */

  }, {
    key: "remove",
    value: function remove() {
      this.svg.remove();
      this.svg = null;
    }
    /**
     * Draws a connecting line between this WordTag and its parent Word, if
     * this is a top WordTag.
     */

  }, {
    key: "drawTagLine",
    value: function drawTagLine() {
      if (!this.top || this.layerIndex > 0) {
        return;
      }

      var wordWidth = this.word.textWidth;

      if (wordWidth < this.config.wordBraceThreshold) {
        // Draw a single vertical line
        this.line.plot("M 0,0, 0," + this.config.wordTagLineLength);
      } else {
        // Draw a curly brace
        var height = this.config.wordTagLineLength;
        var arm = wordWidth / 2;
        this.line.plot("M0,0" + "c" + [0, height, arm, 0, arm, height] + "M0,0" + "c" + [0, height, -arm, 0, -arm, height]);
      }
    }
    /**
     * Sets the text of this WordTag, or returns this WordTag's SVG text element
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

      if (this.editingRect) {
        var bbox = this.svgText.bbox();

        if (bbox.width > 0) {
          this.editingRect.width(bbox.width + 8).height(bbox.height + 4).x(bbox.x - 4).y(bbox.y - 2);
        } else {
          this.editingRect.width(10).x(-5);
        }
      }
    }
    /**
     * Returns the width of the bounding box for this WordTag
     */

  }, {
    key: "boxWidth",
    value: function boxWidth() {
      return this.svg.bbox().width;
    }
    /**
     * Returns the width of the bounding box of the WordTag's SVG text element
     * @return {Number}
     */

  }, {
    key: "textWidth",
    get: function get() {
      return this.svgText.bbox().width;
    }
  }, {
    key: "changeEntity",
    value: function changeEntity(word) {
      if (this.word) {
        this.word.tag = null;
      }

      this.word = word;
      this.word.tag = this;
      this.word.svg.add(this.svg);
    }
  }, {
    key: "listenForEdit",
    value: function listenForEdit() {
      this.isEditing = true;
      var bbox = this.svgText.bbox();
      this.svg.addClass("tag-element").addClass("editing");
      this.editingRect = this.svg.rect(bbox.width + 8, bbox.height + 4).x(bbox.x - 4).y(bbox.y - 2).rx(2).ry(2).back();
    }
  }, {
    key: "stopEditing",
    value: function stopEditing() {
      this.isEditing = false;
      this.svg.removeClass("editing");
      this.editingRect.remove();
      this.editingRect = null;
      this.val = this.val.trim();
      this.tag.val = this.val;

      if (!this.val) {
        this.remove();
      } else {
        this.word.alignBox();
      }
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
  return WordTag;
}();

exports.WordTag = WordTag;