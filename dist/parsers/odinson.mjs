"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OdinsonParser = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _components = require("./components.mjs");

/**
 * Odinson parser class
 */
var OdinsonParser = /*#__PURE__*/function () {
  /**
   * The class constructor
   */
  function OdinsonParser() {
    (0, _classCallCheck2["default"])(this, OdinsonParser);
    // class members, all private

    /** @private */
    this.data = {
      tokens: [],
      links: [],
      clusters: [],
      words: []
    };
    /** @private */

    this.parsedDocuments = {};
    /** @private */

    this.lastTokenIdx = -1;
    /** @private */

    this.longLabelIdx = -1;
    this.parsedMentions = {};
    this.hiddenMentions = new Set();
    this.availableMentions = new Map();
  }
  /**
   * Main function which parses the sentence data. This works with both an
   * array (from which it will extract the first entry) and a single object.
   *
   * @public
   * @param {Array|Object} dataObject Sentence data consisting of an array or single object
   *
   * @returns {Object} Object containing the parsed tokens and the links
   */


  (0, _createClass2["default"])(OdinsonParser, [{
    key: "parse",
    value: function parse(dataObject, hiddenMentions) {
      var _this = this;

      this.reset();
      this.hiddenMentions = new Set(hiddenMentions);
      var toParse = Array.isArray(dataObject) ? dataObject[0] : dataObject;
      this.data.words = toParse.words;
      this.parsedDocuments[0] = this._parseSentence(toParse, Date.now());
      (toParse.match || toParse.matches).forEach(function (mention) {
        _this._parseMention({
          mention: mention,
          relType: toParse.label
        });
      });
      return this.data;
    }
    /**
     * Reinitialize all class properties.
     *
     * @private
     */

  }, {
    key: "reset",
    value: function reset() {
      this.data = {
        tokens: [],
        links: []
      };
      this.parsedDocuments = {};
      this.lastTokenIdx = -1;
      this.longLabelIdx = -1;
      this.hiddenMentions = new Set();
      this.availableMentions = new Map();
      this.parsedMentions = {};
    }
    /**
     * Method to parse and extract tokens and links from a single sentence.
     *
     * @param {Object} sentence Sentence object
     * @param {String} docId The sentence document id
     *
     * @returns {Object} The document object that contains parsed tokens and links.
     */

  }, {
    key: "_parseSentence",
    value: function _parseSentence(sentence, docId) {
      var thisDocument = {};
      var sentenceId = "sentence-".concat(Date.now());
      thisDocument.sentences = [];

      var createLinkInstance = function createLinkInstance(localDocId, sentenceIdLocal, type, index, edge, sentenceData) {
        return new _components.Link("".concat(localDocId, "-").concat(sentenceIdLocal, "-").concat(type, "-").concat(index), sentenceData[edge[0]], [{
          anchor: sentenceData[edge[1]],
          type: edge[2]
        }], edge[2], type);
      };

      var thisSentence = [];
      var sentenceFields = {};
      var sentenceGraph = null;

      for (var i = 0; i < sentence.fields.length; i += 1) {
        var field = sentence.fields[i];

        if (field.name !== "dependencies") {
          sentenceFields[field.name] = field.tokens;
        } else {
          sentenceGraph = field;
        }
      }

      for (var _i = 0; _i < sentenceFields.word.length; _i += 1) {
        var thisToken = new _components.Token(sentenceFields.word[_i], _i + this.lastTokenIdx + 1);

        if (sentenceFields.raw) {
          thisToken.registerLabel("raw", sentenceFields.raw[_i]);
        }

        if (sentenceFields.tag) {
          thisToken.registerLabel("POS", sentenceFields.tag[_i]);
        }

        if (sentenceFields.lemma) {
          thisToken.registerLabel("lemma", sentenceFields.lemma[_i]);
        }

        if (sentenceFields.entity) {
          thisToken.registerLabel("entity", sentenceFields.entity[_i]);
        }

        if (sentenceFields.norms) {
          thisToken.registerLabel("norm", sentenceFields.norms[_i]);
        }

        if (sentenceFields.chunk) {
          thisToken.registerLabel("chunk", sentenceFields.chunk[_i]);
        }

        thisSentence.push(thisToken);
        this.data.tokens.push(thisToken);
      }

      this.lastTokenIdx += sentence.numTokens;

      if (sentenceGraph) {
        for (var _i2 = 0; _i2 < sentenceGraph.edges.length; _i2 += 1) {
          var edge = sentenceGraph.edges[_i2];
          this.data.links.push(createLinkInstance(docId, sentenceId, "universal-basic", _i2, edge, thisSentence));
          this.data.links.push(createLinkInstance(docId, sentenceId, "universal-enhanced", _i2, edge, thisSentence));
        }
      }

      thisDocument.sentences.push(thisSentence);
      return thisDocument;
    }
  }, {
    key: "_generateId",
    value: function _generateId() {
      // Math.random should be unique because of its seeding algorithm.
      // Convert it to base 36 (numbers + letters), and grab the first 9 characters
      // after the decimal.
      return "_" + Math.random().toString(36).substr(2, 9);
    }
  }, {
    key: "_getLabelForTokens",
    value: function _getLabelForTokens(tokens, captureTypeName) {
      if (tokens.length > 1) {
        var longLabel = _components.LongLabel.registerLongLabel("default", captureTypeName, tokens, ++this.longLabelIdx);

        return longLabel;
      } else {
        tokens[0].registerLabel("default", captureTypeName);
        return tokens[0];
      }
    }
  }, {
    key: "_parseMention",
    value: function _parseMention(_ref) {
      var _this2 = this;

      var mention = _ref.mention,
          relType = _ref.relType;
      var span = mention.span,
          captures = mention.captures;
      var id = "".concat(relType, "-").concat(span.start, "-").concat(span.end);
      this.availableMentions.set(id, relType);

      if (this.hiddenMentions.has(id)) {
        return null;
      }

      if (this.parsedMentions[id]) {
        return this.parsedMentions[id];
      }

      var linkArgs = [];
      var spanTokens = this.data.tokens.slice(span.start, span.end);

      var trigger = this._getLabelForTokens(spanTokens, "trigger");

      captures.forEach(function (capture) {
        var captureTypeNames = Object.keys(capture);
        captureTypeNames.forEach(function (captureTypeName) {
          var captureType = capture[captureTypeName];
          var captureSpan = captureType.span;

          var tokens = _this2.data.tokens.slice(captureSpan.start, captureSpan.end);

          var tokenLabel = _this2._getLabelForTokens(tokens, captureTypeName);

          linkArgs.push({
            anchor: tokenLabel,
            type: captureTypeName
          });
        });
      }); // Done; prepare the new Link

      var link = new _components.Link( // eventId
      id, // Trigger
      trigger, // Arguments
      linkArgs, // Relation type
      relType);
      this.data.links.push(link);
      this.parsedMentions[id] = link;
      return link;
    }
  }]);
  return OdinsonParser;
}();

exports.OdinsonParser = OdinsonParser;