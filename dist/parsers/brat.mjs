"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BratParser = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _components = require("./components.mjs");

/**
 * Parser for Brat annotation format
 */
var BratParser = /*#__PURE__*/function () {
  function BratParser() {
    (0, _classCallCheck2["default"])(this, BratParser);
    this.data = {};
    this.re = /:+(?=[TER]\d+$)/; // regular expression for reading in a
    // mention

    this.text = "";
    this.mentions = {};
  }
  /*
    @param textInput : Source text     or  text + input in standoff format
    @param entInput  : entity annotation or input in standoff format
    @param evtInput  : event annotations or {undefined}
   */

  /**
   * Parses the given data.
   * @param {String[]} dataObjects - If the array contains a single string, it
   *   is taken to contain the raw text of the document on the first line,
   *   and annotation data on all subsequent lines.
   *   If it contains more than one string, the first is taken to be the
   *   document text, and all subsequent ones are taken to contain
   *   annotation lines.
   */


  (0, _createClass2["default"])(BratParser, [{
    key: "parse",
    value: function parse(dataObjects) {
      var _this = this;

      this.mentions = {};
      var lines = []; // separate source text and annotation

      if (dataObjects.length === 1) {
        var splitLines = dataObjects[0].split("\n");
        this.text = splitLines[0];
        lines = splitLines.slice(1);
      } else {
        this.text = dataObjects[0]; // Start from the second dataObject

        for (var i = 1; i < dataObjects.length; i++) {
          lines = lines.concat(dataObjects[i].split("\n"));
        }
      } // filter out non-annotation lines


      lines.forEach(function (line) {
        var tokens = line.trim().split(/\s+/);

        if (tokens[0] && tokens[0].match(/[TER]\d+/)) {
          _this.mentions[tokens[0]] = {
            annotation: tokens,
            object: null
          };
        }
      }); // recursively build graph

      var graph = {
        tokens: [],
        links: []
      };
      this.textArray = [{
        charStart: 0,
        charEnd: this.text.length,
        entity: null
      }];

      for (var id in this.mentions) {
        if (this.mentions[id] && this.mentions[id].object === null) {
          this.parseAnnotation(id, graph);
        }
      }

      var n = graph.tokens.length;
      var idx = 0;
      this.textArray.forEach(function (t, i) {
        if (t.entity === null) {
          var text = _this.text.slice(t.charStart, t.charEnd).trim();

          if (text === "") {
            // The un-annotated span contained only whitespace; ignore it
            return;
          }

          text.split(/\s+/).forEach(function (token) {
            var thisToken = new _components.Token(token, idx);
            graph.tokens.push(thisToken);
            idx++;
          });
        } else {
          t.entity.idx = idx;
          idx++;
        }
      });
      graph.tokens.sort(function (a, b) {
        return a.idx - b.idx;
      });
      this.data = graph;
      return this.data;
    }
  }, {
    key: "parseAnnotation",
    value: function parseAnnotation(id, graph) {
      // check if mention exists & has been parsed already
      var m = this.mentions[id];

      if (m === undefined) {
        return null;
      }

      if (m.object !== null) {
        return m.object;
      } // parse annotation


      var tokens = m.annotation;

      switch (tokens[0].charAt(0)) {
        case "T":
          /**
           * Entity annotations have:
           * - Unique ID
           * - Type
           * - Character span
           * - Raw text
           */
          var tbm = this.parseTextMention(tokens);

          if (tbm === null) {
            // invalid line
            delete this.mentions[id];
            return null;
          } else {
            // valid line; add Token
            graph.tokens.push(tbm);
            m.object = tbm;
            return tbm;
          }

        case "E":
          /**
           * Event annotations have:
           * - Unique ID
           * - Type:ID string representing the trigger entity
           * - Role:ID strings representing the argument entities
           */
          var em = this.parseEventMention(tokens, graph);

          if (em === null) {
            // invalid event
            delete this.mentions[id];
            return null;
          } else {
            // valid event; add Link
            graph.links.push(em);
            m.object = em;
            return em;
          }

        case "R":
          /**
           * Binary relations have:
           * - Unique ID
           * - Type
           * - Role:ID strings representing the argument entities (x2)
           */
          var rm = this.parseRelationMention(tokens, graph);

          if (rm === null) {
            // invalid event
            delete this.mentions[id];
            return null;
          } else {
            // valid event; add Link
            graph.links.push(rm);
            m.object = rm;
            return rm;
          }

        case "A":
          break;
      }

      return null;
    }
  }, {
    key: "parseTextMention",
    value: function parseTextMention(tokens) {
      var id = tokens[0].slice(1);
      var label = tokens[1];
      var charStart = Number(tokens[2]);
      var charEnd = Number(tokens[3]);

      if (charStart >= 0 && charStart < charEnd && charEnd <= this.text.length) {
        // create Token
        var token = new _components.Token(this.text.slice(charStart, charEnd), Number(id));
        token.registerLabel("default", label);
        token.addAssociation(id); // cut textArray

        var textWord = {
          charStart: charStart,
          charEnd: charEnd,
          entity: token
        };
        var i = this.textArray.findIndex(function (token) {
          return token.charEnd > charStart;
        });

        if (i === -1) {
          console.log("// mistake in tokenizing string");
        } else if (this.textArray[i].charStart < charStart) {
          // textArray[i] starts to the left of the word
          var tempEnd = this.textArray[i].charEnd;
          this.textArray[i].charEnd = charStart; // insert word into array

          if (tempEnd > charEnd) {
            this.textArray.splice(i + 1, 0, textWord, {
              charStart: charEnd,
              charEnd: tempEnd,
              entity: null
            });
          } else {
            this.textArray.splice(i + 1, 0, textWord);
          }
        } else {
          // textArray[i] starts at the same place or to the right of the word
          if (this.textArray[i].charEnd === charEnd) {
            this.textArray[i].entity = token;
          } else {
            this.textArray.splice(i, 0, textWord);
            this.textArray[i + 1].charStart = charEnd;
            this.textArray[i + 1].entity = null;
          }
        }

        return token;
      } else {
        return null;
      }
    }
  }, {
    key: "searchBackwards",
    value: function searchBackwards(arr, fn) {
      for (var i = arr.length - 1; i >= 0; --i) {
        if (fn(arr[i])) {
          return arr[i];
        }
      }

      return null;
    }
  }, {
    key: "parseEventMention",
    value: function parseEventMention(tokens, graph) {
      var _this2 = this;

      var successfulParse = true;
      var id = tokens[0];
      var args = tokens.slice(1).map(function (token, i) {
        var _token$split = token.split(_this2.re),
            _token$split2 = (0, _slicedToArray2["default"])(_token$split, 2),
            label = _token$split2[0],
            id = _token$split2[1];

        var object = _this2.parseAnnotation(id, graph);

        if (object !== null) {
          return {
            type: label,
            anchor: object
          };
        } else {
          if (i === 0) {
            successfulParse = false;
          }

          return null;
        }
      }).filter(function (arg) {
        return arg;
      });

      if (successfulParse && args.length > 1) {
        // create link
        return new _components.Link(id, args[0].anchor, args.slice(1), "");
      } else {
        return null;
      }
    }
  }, {
    key: "parseRelationMention",
    value: function parseRelationMention(tokens, graph) {
      var _this3 = this;

      if (tokens.length < 4) {
        return null;
      }

      var successfulParse = true;
      var id = tokens[0];
      var reltype = tokens[1];
      var args = tokens.slice(2, 4).map(function (token) {
        var _token$split3 = token.split(_this3.re),
            _token$split4 = (0, _slicedToArray2["default"])(_token$split3, 2),
            label = _token$split4[0],
            id = _token$split4[1];

        var object = _this3.parseAnnotation(id, graph);

        if (object !== null) {
          return {
            type: label,
            anchor: object
          };
        } else {
          successfulParse = false;
        }
      });

      if (successfulParse === true) {
        return new _components.Link(id, null, args, reltype);
      } else {
        return null;
      }
    }
  }]);
  return BratParser;
}();

exports.BratParser = BratParser;