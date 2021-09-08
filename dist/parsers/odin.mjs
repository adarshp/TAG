"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OdinParser = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _components = require("./components.mjs");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Parser for Odin `mentions.json` output
 * https://gist.github.com/myedibleenso/87a3191c73938840b8ed768ec305db38
 */
var OdinParser = /*#__PURE__*/function () {
  function OdinParser() {
    (0, _classCallCheck2["default"])(this, OdinParser);
    // This will eventually hold the parsed data for returning to the caller
    this.data = {
      tokens: [],
      links: []
    }; // Holds the data for individual documents

    this.parsedDocuments = {}; // Previously-parsed mentions, by Id.
    // Old TextBoundMentions return their host Word/WordCluster
    // Old EventMentions/RelationMentions return their Link

    this.parsedMentions = {};
    this.hiddenMentions = new Set();
    this.availableMentions = new Map(); // We record the index of the last Token from the previous sentence so
    // that we can generate each Word's global index (if not Token indices
    // will incorrectly restart from 0 for each new document/sentence)

    this.lastTokenIdx = -1;
  }
  /**
   * Parses the given data, filling out `this.data` accordingly.
   * @param {Array} dataObjects - Array of input data objects.  We expect
   *     there to be only one.
   */


  (0, _createClass2["default"])(OdinParser, [{
    key: "parse",
    value: function parse(dataObjects, hiddenMentions) {
      var _this = this;

      if (dataObjects.length > 1) {
        console.log("Warning: Odin parser received multiple data objects. Only the first" + " data object will be parsed.");
      }

      var data = dataObjects[0]; // Clear out any old parse data

      this.reset();
      this.hiddenMentions = new Set(hiddenMentions); // At the top level, the data has two parts: `documents` and `mentions`.
      // - `documents` includes the tokens and dependency parses for each
      //   document the data contains.
      // - `mentions` includes all the events/relations that *every* document
      //   contains, but each mention has a `document` property that specifies
      //   which document it applies to.
      // We will display the tokens from every document consecutively, and fill in
      // their mentions to match.

      var docIds = Object.keys(data.documents).sort();

      var _iterator = _createForOfIteratorHelper(docIds),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var docId = _step.value;
          this.parsedDocuments[docId] = this._parseDocument(data.documents[docId], docId);
        } // There are a number of different types of mentions types:
        // - TextBoundMention
        // - EventMention

      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      data.mentions.forEach(function (mention) {
        _this.availableMentions.set(mention.id, mention.text);
      });

      var _iterator2 = _createForOfIteratorHelper(data.mentions),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var mention = _step2.value;

          this._parseMention(mention);
        } // Return the parsed data (rather than expecting other modules to access
        // it directly)

      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return this.data;
    }
    /**
     * Clears out all previously cached parse data (in preparation for a new
     * parse)
     */

  }, {
    key: "reset",
    value: function reset() {
      this.data = {
        tokens: [],
        links: []
      };
      this.parsedDocuments = {};
      this.parsedMentions = {};
      this.lastTokenIdx = -1;
      this.availableMentions = new Map();
      this.hiddenMentions = new Set();
    }
    /**
     * Parses a given document (essentially an array of sentences), appending
     * the tokens and first set of dependency links to the final dataset.
     * TODO: Allow user to select between different dependency graphs
     *
     * @param document
     * @property {Object[]} sentences
     *
     * @param {String} docId - Unique identifier for this document
     * @private
     */

  }, {
    key: "_parseDocument",
    value: function _parseDocument(document, docId) {
      var thisDocument = {};
      /** @type Token[][] **/

      thisDocument.sentences = [];
      /**
       * Each sentence is an object with a number of pre-defined properties;
       * we are interested in the following.
       * @property {String[]} words
       * @property raw
       * @property tags
       * @property lemmas
       * @property entities
       * @property norms
       * @property chunks
       * @property graphs
       */

      var _iterator3 = _createForOfIteratorHelper(document.sentences.entries()),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _step3$value = (0, _slicedToArray2["default"])(_step3.value, 2),
              sentenceId = _step3$value[0],
              sentence = _step3$value[1];

          // Hold on to the Words we generate even as we push them up to the
          // main data store, so that we can create their syntax Links too
          // (which rely on sentence-level indices, not global indices)
          var thisSentence = []; // Read any token-level annotations

          for (var thisIdx = 0; thisIdx < sentence.words.length; thisIdx++) {
            var thisToken = new _components.Token( // Text
            sentence.words[thisIdx], // (Global) Token index
            thisIdx + this.lastTokenIdx + 1); // Various token-level tags, if they are available

            if (sentence.raw) {
              thisToken.registerLabel("raw", sentence.raw[thisIdx]);
            }

            if (sentence.tags) {
              thisToken.registerLabel("POS", sentence.tags[thisIdx]);
            }

            if (sentence.lemmas) {
              thisToken.registerLabel("lemma", sentence.lemmas[thisIdx]);
            }

            if (sentence.entities) {
              thisToken.registerLabel("entity", sentence.entities[thisIdx]);
            }

            if (sentence.norms) {
              thisToken.registerLabel("norm", sentence.norms[thisIdx]);
            }

            if (sentence.chunks) {
              thisToken.registerLabel("chunk", sentence.chunks[thisIdx]);
            }

            thisSentence.push(thisToken);
            this.data.tokens.push(thisToken);
          } // Update the global Word index offset for the next sentence


          this.lastTokenIdx += sentence.words.length; // Sentences may have multiple dependency graphs available

          var graphTypes = Object.keys(sentence.graphs);

          for (var _i = 0, _graphTypes = graphTypes; _i < _graphTypes.length; _i++) {
            var graphType = _graphTypes[_i];

            /**
             * @property {Object[]} edges
             * @property roots
             */
            var graph = sentence.graphs[graphType];
            /**
             * @property {Number} source
             * @property {Number} destination
             * @property {String} relation
             */

            var _iterator4 = _createForOfIteratorHelper(graph.edges.entries()),
                _step4;

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _step4$value = (0, _slicedToArray2["default"])(_step4.value, 2),
                    edgeId = _step4$value[0],
                    edge = _step4$value[1];

                this.data.links.push(new _components.Link( // eventId
                "".concat(docId, "-").concat(sentenceId, "-").concat(graphType, "-").concat(edgeId), // Trigger
                thisSentence[edge.source], // Arguments
                [{
                  anchor: thisSentence[edge.destination],
                  type: edge.relation
                }], // Relation type
                edge.relation, // Category
                graphType));
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }

          thisDocument.sentences.push(thisSentence);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      return thisDocument;
    }
    /**
     * Parses the given mention and enriches the data stores accordingly.
     *
     * - TextBoundMentions become Labels
     * - EventMentions become Links
     * - RelationMentions become Links
     *
     * @param mention
     * @private
     */

  }, {
    key: "_parseMention",
    value: function _parseMention(mention) {
      /**
       * @property {String} mention.type
       * @property {String} mention.id
       * @property {String} mention.document - The ID of the mention's host
       *     document
       * @property {Number} mention.sentence - The index of the sentence in the
       *     document that this mention comes from
       * @property {Object} mention.tokenInterval - The start and end indices
       *     for this mention
       * @property {String[]} mention.labels - An Array of the labels that
       *     this mention should have.  By convention, the first element in the
       *     Array is the actual label, and the other elements simply reflect the
       *     higher-levels of the label's taxonomic hierarchy.
       * @property {Object} mention.arguments
       */
      if (this.hiddenMentions.has(mention.id)) {
        return null;
      } // Have we seen this one before?


      if (this.parsedMentions[mention.id]) {
        return this.parsedMentions[mention.id];
      } // TextBoundMention
      // Will become either a tag for a Word, or a WordCluster.


      if (mention.type === "TextBoundMention") {
        var tokens = this.parsedDocuments[mention.document].sentences[mention.sentence].slice(mention.tokenInterval.start, mention.tokenInterval.end);
        var label = mention.labels[0];

        if (tokens.length === 1) {
          // Set the annotation Label for this Token
          tokens[0].registerLabel("default", label);
          this.parsedMentions[mention.id] = tokens[0];
          return tokens[0];
        } else {
          // Set the LongLabel for these tokens
          var longLabel = _components.LongLabel.registerLongLabel("default", label, tokens);

          this.parsedMentions[mention.id] = longLabel;
          return longLabel;
        }
      } // EventMention/RelationMention
      // Will become a Link


      if (mention.type === "EventMention" || mention.type === "RelationMention") {
        // If there is a trigger, it will be a nested Mention.  Ensure it is
        // parsed.
        var trigger = null;

        if (mention.trigger) {
          trigger = this._parseMention(mention.trigger);
        } // Read the relation label


        var relType = mention.labels[0]; // Generate the arguments array
        // `mentions.arguments` is an Object keyed by argument type.
        // The value of each key is an array of nested Mentions as arguments

        var linkArgs = [];

        for (var _i2 = 0, _Object$entries = Object.entries(mention["arguments"]); _i2 < _Object$entries.length; _i2++) {
          var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i2], 2),
              type = _Object$entries$_i[0],
              args = _Object$entries$_i[1];

          var _iterator5 = _createForOfIteratorHelper(args),
              _step5;

          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
              var arg = _step5.value;

              // Ensure that the argument mention has been parsed before
              var anchor = this._parseMention(arg);

              if (anchor) {
                linkArgs.push({
                  anchor: anchor,
                  type: type
                });
              }
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
        } // Done; prepare the new Link


        var link = new _components.Link( // eventId
        mention.id, // Trigger
        trigger, // Arguments
        linkArgs, // Relation type
        relType);
        this.data.links.push(link);
        this.parsedMentions[mention.id] = link;
        return link;
      }
    }
  }]);
  return OdinParser;
}();

exports.OdinParser = OdinParser;