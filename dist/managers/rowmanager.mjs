"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RowManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _row = require("../components/row.mjs");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var RowManager = /*#__PURE__*/function () {
  /**
   * Instantiate a RowManager for some TAG instance
   * @param svg - The svg.js API object for the current TAG instance
   * @param config - The Config object for the instance
   */
  function RowManager(svg, config) {
    (0, _classCallCheck2["default"])(this, RowManager);
    this.config = config;
    this._svg = svg;
    this._rows = [];
  }
  /**
   * Resizes all the Rows in the visualisation, making sure that they all
   * fit the parent container and that none of the Rows/Words overlap
   */


  (0, _createClass2["default"])(RowManager, [{
    key: "resizeAll",
    value: function resizeAll() {
      this.width(this._svg.width());
      this.resizeRow(0);
      this.fitWords();
    }
    /**
     * Attempts to adjust the height of the Row with index `i` by the specified
     * `dy`.  If successful, also adjusts the positions of all the Rows that
     * follow it accordingly.
     *
     * If called without a `dy`, simply ensures that the Row's height is at
     * least as large as its minimum height.
     */

  }, {
    key: "resizeRow",
    value: function resizeRow(i) {
      var dy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var row = this._rows[i];
      if (!row) return; // Height adjustment

      var newHeight = this.config.compactRows ? row.minHeight : Math.max(row.rh + dy, row.minHeight);

      if (row.rh !== newHeight) {
        row.height(newHeight);
        row.redrawLinksAndClusters();
      } // Adjust position/height of all following Rows


      for (i = i + 1; i < this._rows.length; i++) {
        var prevRow = this._rows[i - 1];
        var thisRow = this._rows[i]; // Height check

        var changed = false;

        var _newHeight = this.config.compactRows ? thisRow.minHeight : Math.max(thisRow.rh, thisRow.minHeight);

        if (thisRow.rh !== _newHeight) {
          thisRow.height(_newHeight);
          changed = true;
        } // Position check


        if (thisRow.ry !== prevRow.ry2) {
          thisRow.move(prevRow.ry2);
          changed = true;
        }

        if (changed) {
          thisRow.redrawLinksAndClusters();
        }
      }

      this._svg.height(this.lastRow.ry2 + 20);
    }
    /**
     * Sets the width of all the Rows in the visualisation
     * @param {Number} rw - The new Row width
     */

  }, {
    key: "width",
    value: function width(rw) {
      var _this = this;

      this._rows.forEach(function (row) {
        row.width(rw); // Find any Words that no longer fit on the Row

        var i = row.words.findIndex(function (w) {
          return w.x + w.minWidth > rw - _this.config.rowEdgePadding;
        });

        if (i > 0) {
          while (i < row.words.length) {
            _this.moveLastWordDown(row.idx);
          }
        } else {
          // Redraw Words/Links that might have changed
          row.redrawLinksAndClusters();
        }
      });
    }
    /**
     * Makes sure that all Words fit nicely on their Rows without overlaps.
     * Runs through all the Words on all the Rows in order; the moment one is
     * found that overlaps with a neighbour, a recursive move is initiated.
     */

  }, {
    key: "fitWords",
    value: function fitWords() {
      var _iterator = _createForOfIteratorHelper(this._rows),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var row = _step.value;

          for (var i = 1; i < row.words.length; i++) {
            var prevWord = row.words[i - 1];
            var thisWord = row.words[i];
            var thisWordPadding = thisWord.isPunct ? this.config.wordPunctPadding : this.config.wordPadding;
            var thisMinX = prevWord.x + prevWord.minWidth + thisWordPadding;
            var diff = thisMinX - thisWord.x;

            if (diff > 0) {
              return this.moveWordRight({
                row: row,
                wordIndex: i,
                dx: diff
              });
            }
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    /**
     * Adds a new Row to the bottom of the svg and sets the height of the main
     * document to match
     */

  }, {
    key: "appendRow",
    value: function appendRow() {
      var lr = this.lastRow;
      var row = !lr ? new _row.Row(this._svg, this.config) : new _row.Row(this._svg, this.config, lr.idx + 1, lr.ry2);

      this._rows.push(row);

      this._svg.height(row.ry2 + 20);

      return row;
    }
    /**
     * remove last row at the bottom of the svg and resize to match
     */

  }, {
    key: "removeLastRow",
    value: function removeLastRow() {
      this._rows.pop().remove();

      if (this.lastRow) {
        this._svg.height(this.lastRow.ry2 + 20);
      }
    }
    /**
     * Adds the given Word to the given Row at the given index.
     * Optionally attempts to force an x-position for the Word, which will also
     * adjust the x-positions of any Words with higher indices on this Row.
     * @param word
     * @param row
     * @param i
     * @param forceX
     */

  }, {
    key: "addWordToRow",
    value: function addWordToRow(word, row, i, forceX) {
      if (isNaN(i)) {
        i = row.words.length;
      }

      var overflow = row.addWord(word, i, forceX);

      while (overflow < row.words.length) {
        this.moveLastWordDown(row.idx);
      } // Now that the Words are settled, make sure that the Row is high enough
      // (in case it started too short) and has enough descent space, if there
      // are Rows following.


      this.resizeRow(row.idx);
    }
  }, {
    key: "moveWordOnRow",
    value: function moveWordOnRow(word, dx) {
      var row = word.row;

      if (!row) {
        return;
      }

      if (dx >= 0) {
        this.moveWordRight({
          row: row,
          wordIndex: row.words.indexOf(word),
          dx: dx
        });
      } else if (dx < 0) {
        dx = -dx;
        this.moveWordLeft({
          row: row,
          wordIndex: row.words.indexOf(word),
          dx: dx
        });
      }
    }
    /**
     * Recursively attempts to move the Word at the given index on the given
     * Row rightwards. If it runs out of space, moves all other Words right or
     * to the next Row as needed.
     * @param {Row} params.row
     * @param {Number} params.wordIndex
     * @param {Number} params.dx - A positive number specifying how far to the
     *     right we should move the Word
     */

  }, {
    key: "moveWordRight",
    value: function moveWordRight(params) {
      var row = params.row;
      var wordIndex = params.wordIndex;
      var dx = params.dx;
      var word = row.words[wordIndex];
      var nextWord = row.words[wordIndex + 1]; // First, check if we have space available directly next to this word.

      var rightEdge;

      if (nextWord) {
        rightEdge = nextWord.x;
        rightEdge -= nextWord.isPunct ? this.config.wordPunctPadding : this.config.wordPadding;
      } else {
        rightEdge = row.rw - this.config.rowEdgePadding;
      }

      var space = rightEdge - (word.x + word.minWidth);

      if (dx <= space) {
        word.dx(dx);
        return;
      } // No space directly available; recursively move the following Words.


      if (!nextWord) {
        // Last word on this row
        this.moveLastWordDown(row.idx);
      } else {
        // Move next Word, then move this Word again
        this.moveWordRight({
          row: row,
          wordIndex: wordIndex + 1,
          dx: dx
        });
        this.moveWordRight(params);
      }
    }
    /**
     * Recursively attempts to move the Word at the given index on the given
     * Row leftwards. If it runs out of space, tries to move preceding Words
     * leftwards or to the previous Row as needed.
     * @param {Row} params.row
     * @param {Number} params.wordIndex
     * @param {Number} params.dx - A positive number specifying how far to the
     *     left we should try to move the Word
     * @return {Boolean} True if the Word was successfully moved
     */

  }, {
    key: "moveWordLeft",
    value: function moveWordLeft(params) {
      var row = params.row;
      var wordIndex = params.wordIndex;
      var dx = params.dx;
      var word = row.words[wordIndex];
      var prevWord = row.words[wordIndex - 1];
      var leftPadding = word.isPunct ? this.config.wordPunctPadding : this.config.wordPadding; // First, check if we have space available directly next to this word.

      var space = word.x;

      if (prevWord) {
        space -= prevWord.x + prevWord.minWidth + leftPadding;
      } else {
        space -= this.config.rowEdgePadding;
      }

      if (dx <= space) {
        word.dx(-dx);
        return true;
      } // No space directly available; try to recursively move the preceding Words.
      // If this is the first Word on this Row, try fitting it on the
      // previous Row, or getting the Words on the previous Row to shift.


      if (wordIndex === 0) {
        var prevRow = this._rows[row.idx - 1];

        if (!prevRow) {
          return false;
        } // Fits on the previous Row?


        if (prevRow.availableSpace >= word.minWidth + leftPadding) {
          this.moveFirstWordUp(row.idx);
          return true;
        } // Can we shift the Words on the previous Row?


        var prevRowShift = word.minWidth + leftPadding - prevRow.availableSpace;

        var _canMove = this.moveWordLeft({
          row: prevRow,
          wordIndex: prevRow.words.length - 1,
          dx: prevRowShift
        });

        if (_canMove) {
          // Pop this word up to the previous row
          this.moveFirstWordUp(row.idx);
          return true;
        } else {
          // No can do
          return false;
        }
      } // Not the first Word; try getting the preceding Words on this Row to shift.


      var canMove = this.moveWordLeft({
        row: row,
        wordIndex: wordIndex - 1,
        dx: dx
      });

      if (canMove) {
        // Retry the move (noting that our index may have changed if earlier
        // Words were popped up to the previous Row
        return this.moveWordLeft({
          row: row,
          wordIndex: row.words.indexOf(word),
          dx: dx
        });
      } else {
        // Ah well
        return false;
      }
    }
    /**
     * Move the first Word on the Row with the given index up to the end
     * of the previous Row
     * @param index
     */

  }, {
    key: "moveFirstWordUp",
    value: function moveFirstWordUp(index) {
      var row = this._rows[index];
      var prevRow = this._rows[index - 1];

      if (!row || !prevRow) {
        return;
      }

      var word = row.words[0];
      var newX = prevRow.rw - this.config.rowEdgePadding - word.minWidth;
      row.removeWord(word);
      this.addWordToRow(word, prevRow, undefined, newX);
      word.redrawClusters();
      word.redrawLinks();

      if (row === this.lastRow && row.words.length === 0) {
        this.removeLastRow();
      }
    }
    /**
     * Move the last Word on the Row with the given index down to the start of
     * the next Row
     * @param index
     */

  }, {
    key: "moveLastWordDown",
    value: function moveLastWordDown(index) {
      var nextRow = this._rows[index + 1] || this.appendRow();
      this.addWordToRow(this._rows[index].removeLastWord(), nextRow, 0);
    }
    /**
     * Returns the last Row managed by the RowManager
     * @return {*}
     */

  }, {
    key: "lastRow",
    get: function get() {
      return this._rows[this._rows.length - 1];
    }
    /**
     * Returns the RowManager's internal Row array
     * @return {Array}
     */

  }, {
    key: "rows",
    get: function get() {
      return this._rows;
    }
  }]);
  return RowManager;
}();

exports.RowManager = RowManager;