"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Row = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// import { SVG } from '@svgdotjs/svg.js';
// import '@svgdotjs/svg.draggable.js';
var Row = /*#__PURE__*/function () {
  /**
   * Creates a new Row for holding Words.
   *
   * @param svg - This Row's SVG group
   * @param {Config~Config} config - The Config object for the parent TAG
   *   instance
   * @param {Number} idx - The Row's index
   * @param {Number} ry - The y-position of the Row's top edge
   * @param {Number} rh - The Row's height
   */
  function Row(svg, config) {
    var idx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var ry = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var rh = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 100;
    (0, _classCallCheck2["default"])(this, Row);
    this.config = config;
    this.idx = idx;
    this.ry = ry; // row position from top

    this.rh = rh; // row height

    this.rw = 0;
    this.words = []; // svg elements

    this.svg = null; // group

    this.draggable = null; // row resizer

    this.wordGroup = null; // child group element
    // The last Word we removed, if any.
    // In case we have a Row with no Words left but which still has Links
    // passing through.

    this.lastRemovedWord = null;

    if (svg) {
      this.svgInit(svg);
    }
  }
  /**
   * Initialises the SVG elements related to this Row, and performs an
   * initial draw of the baseline/resize line
   * @param mainSvg - The main SVG document
   */


  (0, _createClass2["default"])(Row, [{
    key: "svgInit",
    value: function svgInit(mainSvg) {
      var _this = this;

      // All positions will be relative to the baseline for this Row
      this.svg = mainSvg.group().transform({
        y: this.baseline
      }).addClass("tag-element").addClass("row"); // Group element to contain word elements

      this.wordGroup = this.svg.group(); // Row width

      this.rw = mainSvg.width(); // Add draggable resize line

      this.draggable = this.svg.line(0, 0, this.rw, 0).addClass("tag-element").addClass("row-drag").draggable();
      var y = 0;
      this.draggable.on("dragstart", function (e) {
        y = e.detail.p.y;
      }).on("dragmove", function (e) {
        e.preventDefault();
        var dy = e.detail.p.y - y;
        y = e.detail.p.y;
        mainSvg.fire("row-resize", {
          object: _this,
          y: dy
        });
      });
    }
    /**
     * Removes all elements related to this Row from the main SVG document
     * @return {*}
     */

  }, {
    key: "remove",
    value: function remove() {
      return this.svg.remove();
    }
    /**
     * Changes the y-position of this Row's upper bound by the given amount
     * @param y
     */

  }, {
    key: "dy",
    value: function dy(y) {
      this.ry += y;
      this.svg.transform({
        y: this.baseline
      });
    }
    /**
     * Moves this Row's upper bound vertically to the given y-position
     * @param y
     */

  }, {
    key: "move",
    value: function move(y) {
      this.ry = y;
      this.svg.transform({
        y: this.baseline
      });
    }
    /**
     * Sets the height of this Row
     * @param rh
     */

  }, {
    key: "height",
    value: function height(rh) {
      this.rh = rh;
      this.svg.transform({
        y: this.baseline
      });
    }
    /**
     * Sets the width of this Row
     * @param rw
     */

  }, {
    key: "width",
    value: function width(rw) {
      this.rw = rw;
      this.draggable.attr("x2", this.rw);
    }
    /**
     * Adds the given Word to this Row at the given index, adjusting the
     * x-positions of any Words with higher indices.
     * Optionally, attempts to force an x-position for the Word.
     * If adding the Word to the Row causes any existing Words to overflow its
     * bounds, will return the index of the first Word that no longer fits.
     * @param word
     * @param index
     * @param forceX
     * @return {number} - The index of the first Word that no longer fits, if
     *     the additional Word causes overflow
     */

  }, {
    key: "addWord",
    value: function addWord(word, index, forceX) {
      if (isNaN(index)) {
        index = this.words.length;
      }

      word.row = this;
      this.words.splice(index, 0, word);
      this.wordGroup.add(word.svg); // Determine the new x-position this Word should have.

      word.x = -1;
      var newX;

      if (index === 0) {
        newX = this.config.rowEdgePadding;
      } else {
        var prevWord = this.words[index - 1];
        newX = prevWord.x + prevWord.minWidth;

        if (word.isPunct) {
          newX += this.config.wordPunctPadding;
        } else {
          newX += this.config.wordPadding;
        }
      }

      if (forceX) {
        newX = forceX;
      }

      return this.positionWord(word, newX);
    }
    /**
     * Assumes that the given Word is already on this Row.
     * Tries to move the Word to the given x-position, adjusting the
     * x-positions of all the following Words on the Row as well.
     * If this ends up pushing some Words off the Row, returns the index of
     * the first Word that no longer fits.
     * @param word
     * @param newX
     * @return {number} - The index of the first Word that no longer fits, if
     *     the additional Word causes overflow
     */

  }, {
    key: "positionWord",
    value: function positionWord(word, newX) {
      var wordIndex = this.words.indexOf(word);
      var prevWord = this.words[wordIndex - 1];
      var nextWord = this.words[wordIndex + 1]; // By default, assume that no Words have overflowed the Row

      var overflowIndex = this.words.length; // Make sure we aren't stomping over a previous Word

      if (prevWord) {
        var wordPadding = word.isPunct ? this.config.wordPunctPadding : this.config.wordPadding;

        if (newX < prevWord.x + prevWord.minWidth + wordPadding) {
          throw "Trying to position new Word over existing one!\n        (Row: ".concat(this.idx, ", wordIndex: ").concat(wordIndex, ")");
        }
      } // Change the position of the next Word if we have to;


      if (nextWord) {
        var nextWordPadding = nextWord.isPunct ? this.config.wordPunctPadding : this.config.wordPadding;

        if (nextWord.x - nextWordPadding < newX + word.minWidth) {
          overflowIndex = this.positionWord(nextWord, newX + word.minWidth + nextWordPadding);
        }
      } // We have moved the next Word on the Row, or marked it as part of the
      // overflow; at this point, we either have space to move this Word, or
      // this Word itself is about to overflow the Row.


      if (newX + word.minWidth > this.rw - this.config.rowEdgePadding) {
        // Alas.  The overflowIndex is ours.
        return wordIndex;
      } else {
        // We can move.  If any of the Words that follow us overflowed, return
        // their index.
        word.move(newX);
        return overflowIndex;
      }
    }
    /**
     * Removes the specified Word from this Row, returning it for potential
     * further operations.
     * @param word
     * @return {Word}
     */

  }, {
    key: "removeWord",
    value: function removeWord(word) {
      if (this.lastRemovedWord !== word) {
        this.lastRemovedWord = word;
      }

      this.words.splice(this.words.indexOf(word), 1);
      this.wordGroup.removeElement(word.svg);
      return word;
    }
    /**
     * Removes the last Word from this Row, returning it for potential
     * further operations.
     * @return {Word}
     */

  }, {
    key: "removeLastWord",
    value: function removeLastWord() {
      return this.removeWord(this.words[this.words.length - 1]);
    }
    /**
     * Redraws all the unique Links and WordClusters associated with all the
     * Words in the row
     */

  }, {
    key: "redrawLinksAndClusters",
    value: function redrawLinksAndClusters() {
      var elements = [];

      var _iterator = _createForOfIteratorHelper(this.words),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var word = _step.value;

          var _iterator2 = _createForOfIteratorHelper(word.passingLinks),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var link = _step2.value;

              if (elements.indexOf(link) < 0) {
                elements.push(link);
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }

          var _iterator3 = _createForOfIteratorHelper(word.clusters),
              _step3;

          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var cluster = _step3.value;

              if (elements.indexOf(cluster) < 0) {
                elements.push(cluster);
              }
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      elements.forEach(function (element) {
        return element.draw();
      });
    }
    /**
     * Gets the y-position of the Row's baseline (where the draggable resize
     * line is, and the baseline for all the Row's words)
     */

  }, {
    key: "baseline",
    get: function get() {
      return this.ry + this.rh;
    }
    /**
     * Returns the lower bound of the Row on the y-axis
     * @return {number}
     */

  }, {
    key: "ry2",
    get: function get() {
      return this.ry + this.rh + this.minDescent;
    }
    /**
     * Returns the maximum slot occupied by Links related to Words on this Row.
     * Considers positive slots, so only accounts for top Links.
     */

  }, {
    key: "maxSlot",
    get: function get() {
      var checkWords = this.words;

      if (checkWords.length === 0 && this.lastRemovedWord !== null) {
        // We let all our Words go; what was the last one that mattered?
        checkWords = [this.lastRemovedWord];
      }

      var maxSlot = 0;

      var _iterator4 = _createForOfIteratorHelper(checkWords),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var word = _step4.value;

          var _iterator5 = _createForOfIteratorHelper(word.passingLinks),
              _step5;

          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
              var link = _step5.value;
              maxSlot = Math.max(maxSlot, link.slot);
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      return maxSlot;
    }
    /**
     * Returns the minimum slot occupied by Links related to Words on this Row.
     * Considers negative slots, so only accounts for bottom Links.
     */

  }, {
    key: "minSlot",
    get: function get() {
      var checkWords = this.words;

      if (checkWords.length === 0 && this.lastRemovedWord !== null) {
        // We let all our Words go; what was the last one that mattered?
        checkWords = [this.lastRemovedWord];
      }

      var minSlot = 0;

      var _iterator6 = _createForOfIteratorHelper(checkWords),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var word = _step6.value;

          var _iterator7 = _createForOfIteratorHelper(word.passingLinks),
              _step7;

          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var link = _step7.value;
              minSlot = Math.min(minSlot, link.slot);
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }

      return minSlot;
    }
    /**
     * Returns the maximum height above the baseline of the Word
     * elements on the Row (accounting for their top WordTags and attached
     * WordClusters, if present)
     */

  }, {
    key: "wordHeight",
    get: function get() {
      var wordHeight = 0;

      var _iterator8 = _createForOfIteratorHelper(this.words),
          _step8;

      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var word = _step8.value;
          wordHeight = Math.max(wordHeight, word.boxHeight);

          if (word.clusters.length > 0) {
            var _iterator10 = _createForOfIteratorHelper(word.clusters),
                _step10;

            try {
              for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                var _cluster = _step10.value;
                wordHeight = Math.max(wordHeight, _cluster.fullHeight);
              }
            } catch (err) {
              _iterator10.e(err);
            } finally {
              _iterator10.f();
            }
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }

      if (wordHeight === 0 && this.lastRemovedWord) {
        // If we have no Words left on this Row, base our calculations on the
        // last Word that was on this Row, for positioning any Links that are
        // still passing through
        wordHeight = this.lastRemovedWord.boxHeight;

        if (this.lastRemovedWord.clusters.length > 0) {
          var _iterator9 = _createForOfIteratorHelper(this.lastRemovedWord.clusters),
              _step9;

          try {
            for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
              var cluster = _step9.value;
              wordHeight = Math.max(wordHeight, cluster.fullHeight);
            }
          } catch (err) {
            _iterator9.e(err);
          } finally {
            _iterator9.f();
          }
        }
      }

      return wordHeight;
    }
    /**
     * Returns the maximum descent below the baseline of the Word
     * elements on the Row (accounting for their bottom WordTags, if present)
     */

  }, {
    key: "wordDescent",
    get: function get() {
      var wordDescent = 0;

      var _iterator11 = _createForOfIteratorHelper(this.words),
          _step11;

      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var word = _step11.value;
          wordDescent = Math.max(wordDescent, word.descendHeight);
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }

      return wordDescent;
    }
    /**
     * Returns the minimum amount of height above the baseline needed to fit
     * all this Row's Words, top WordTags and currently-visible top Links.
     * Includes vertical Row padding.
     * @return {number}
     */

  }, {
    key: "minHeight",
    get: function get() {
      // Minimum height needed for Words + padding only
      var height = this.wordHeight + this.config.rowVerticalPadding; // Highest visible top Link

      var maxVisibleSlot = 0;
      var checkWords = this.words;

      if (checkWords.length === 0 && this.lastRemovedWord !== null) {
        // We let all our Words go; what was the last one that mattered?
        checkWords = [this.lastRemovedWord];
      }

      var _iterator12 = _createForOfIteratorHelper(checkWords),
          _step12;

      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var word = _step12.value;

          var _iterator13 = _createForOfIteratorHelper(word.links.concat(word.passingLinks)),
              _step13;

          try {
            for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
              var link = _step13.value;

              if (link.top && link.visible) {
                maxVisibleSlot = Math.max(maxVisibleSlot, link.slot);
              }
            }
          } catch (err) {
            _iterator13.e(err);
          } finally {
            _iterator13.f();
          }
        } // Because top Link labels are above the Link lines, we need to add
        // their height if any of the Words on this Row is an endpoint for a Link

      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }

      if (maxVisibleSlot > 0) {
        return height + maxVisibleSlot * this.config.linkSlotInterval + this.config.rowExtraTopPadding;
      } // Still here?  No visible top Links on this row.


      return height;
    }
    /**
     * Returns the minimum amount of descent below the baseline needed to fit
     * all this Row's bottom WordTags and currently-visible bottom Links.
     * Includes vertical Row padding.
     * @return {number}
     */

  }, {
    key: "minDescent",
    get: function get() {
      // Minimum height needed for WordTags + padding only
      var descent = this.wordDescent + this.config.rowVerticalPadding; // Lowest visible bottom Link

      var minVisibleSlot = 0;
      var checkWords = this.words;

      if (checkWords.length === 0 && this.lastRemovedWord !== null) {
        // We let all our Words go; what was the last one that mattered?
        checkWords = [this.lastRemovedWord];
      }

      var _iterator14 = _createForOfIteratorHelper(checkWords),
          _step14;

      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var word = _step14.value;

          var _iterator15 = _createForOfIteratorHelper(word.links.concat(word.passingLinks)),
              _step15;

          try {
            for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
              var link = _step15.value;

              if (!link.top && link.visible) {
                minVisibleSlot = Math.min(minVisibleSlot, link.slot);
              }
            }
          } catch (err) {
            _iterator15.e(err);
          } finally {
            _iterator15.f();
          }
        } // Unlike in the `minHeight()` function, bottom Link labels do not
        // extend below the Link lines, so we don't need to add extra padding
        // for them.

      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }

      if (minVisibleSlot < 0) {
        return descent + Math.abs(minVisibleSlot) * this.config.linkSlotInterval;
      } // Still here?  No visible bottom Links on this row.


      return descent;
    }
    /**
     * Returns the amount of space available at the end of this Row for adding
     * new Words
     */

  }, {
    key: "availableSpace",
    get: function get() {
      if (this.words.length === 0) {
        return this.rw - this.config.rowEdgePadding * 2;
      }

      var lastWord = this.words[this.words.length - 1];
      return this.rw - this.config.rowEdgePadding - lastWord.x - lastWord.minWidth;
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
  }]);
  return Row;
}();

exports.Row = Row;