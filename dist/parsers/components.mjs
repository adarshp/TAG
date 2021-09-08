"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Token = exports.LongLabel = exports.Link = exports.Label = void 0;

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

/**
 * Annotations labels for single Tokens.
 *
 * Labels are added to a Token via the `.registerLabel()` method. Parsers
 * should not instantiate Labels directly.
 */
var Label =
/**
 * Creates a new Label.
 * @param {String} val - The raw text for the Label
 * @param {Token} token - The parent Token for the Label
 */
function Label(val, token) {
  (0, _classCallCheck2["default"])(this, Label);
  this.type = "Label";
  this.val = val;
  this.token = token;
};
/**
 * Annotated events and other relationships between Tokens.
 */


exports.Label = Label;

var Link =
/**
 * Instantiates a Link.
 * Links can have Words or other Links as argument anchors.
 *
 * @param {String} eventId - Unique ID
 * @param {Word} trigger - Text-bound entity that indicates the presence of
 *     this event
 * @param {Object[]} args - The arguments to this Link. An Array of
 *     Objects specifying `anchor` and `type`
 * @param {String} relType - For (binary) relational Links, a String
 *     identifying the relationship type
 * @param {String} category - Links can be shown/hidden by category
 */
function Link(eventId, trigger, args, relType) {
  var _this = this;

  var category = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "default";
  (0, _classCallCheck2["default"])(this, Link);
  this.type = "Link"; // ---------------
  // Core properties

  this.eventId = eventId; // Links can be either Event or Relation annotations, to borrow the BRAT
  // terminology.  Event annotations have a `trigger` entity from the text
  // that specifies the event, whereas Relation annotations have a `type`
  // that may not be bound to any particular part of the raw text.
  // Both types of Links have arguments, which may themselves be nested links.

  this.trigger = trigger;
  this.relType = relType;
  this.arguments = args; // Contains references to higher-level Links that have this Link as an
  // argument

  this.links = [];
  this.category = category; // Fill in references in this Link's trigger/argument Tokens

  if (this.trigger) {
    this.trigger.links.push(this);
  }

  this.arguments.forEach(function (arg) {
    arg.anchor.links.push(_this);
  });
};
/**
 * Annotations labels that span multiple Tokens.
 *
 * Parsers should not instantiate LongLabels directly.
 *
 * Because LongLabels span multiple words, they cannot simply be added via
 * Token methods; rather, use the static `LongLabel.registerLongLabel()` method
 * to register a LongLabel to a group of Tokens.
 */


exports.Link = Link;

var LongLabel = /*#__PURE__*/function () {
  /**
   * Instantiates a LongLabel.
   * Parsers should be calling `LongLabel.registerLongLabel()` instead.
   * @param {String} val - The raw text for the Label
   * @param {Token[]} tokens - The parent Tokens for the LongLabel
   */
  function LongLabel(val, tokens, idx) {
    (0, _classCallCheck2["default"])(this, LongLabel);
    this.type = "LongLabel";
    this.val = val;
    this.tokens = tokens;
    this.idx = idx;
    this.links = [];
  }
  /**
   * Registers a new LongLabel for a group of Tokens.
   * @param {String} category - The category to register this LongLabel under
   * @param {String} val - The raw text for the Label
   * @param {Token[]} tokens - The parent Tokens for the LongLabel
   */


  (0, _createClass2["default"])(LongLabel, null, [{
    key: "registerLongLabel",
    value: function registerLongLabel(category, val, tokens, idx) {
      var longLabel = new LongLabel(val, tokens, idx);
      tokens.forEach(function (token) {
        token.registerLongLabel(category, longLabel);
      });
      return longLabel;
    }
  }]);
  return LongLabel;
}();
/**
 * Objects representing raw entity/token strings within the document being
 * parsed.  Represents only the document's annotations, in structured form;
 * does not include drawing data or other metadata that might be added for
 * the visualisation.
 *
 * Tokens may be associated with one or more Label annotations.
 * Labels that span multiple Tokens are instantiated as LongLabels instead.
 */


exports.LongLabel = LongLabel;

var Token = /*#__PURE__*/function () {
  /**
   * Creates a new Token.
   * @param {String} text - The raw text for this Token
   * @param {Number} idx - The index of this Token within the
   *     currently-parsed document
   */
  function Token(text, idx) {
    (0, _classCallCheck2["default"])(this, Token);
    this.type = "Token";
    this.text = text;
    this.idx = idx; // Optional properties that may be set later
    // -----------------------------------------
    // Arbitrary values that this Token is associated with -- For
    // convenience when parsing.

    this.associations = []; // Back-references that will be set when this Token is used in
    // other structures
    // ---------------------------------------------------------
    // Labels/LongLabels by category

    this.registeredLabels = {}; // Links

    this.links = [];
  }
  /**
   * Any data (essentially arbitrary labels) that this Token is
   * associated with
   * @param data
   */


  (0, _createClass2["default"])(Token, [{
    key: "addAssociation",
    value: function addAssociation(data) {
      if (this.associations.indexOf(data) < 0) {
        this.associations.push(data);
      }
    }
    /**
     * Register this Token's Label for the given category of labels (e.g., POS
     * tags, lemmas, etc.)
     *
     * At run-time, one category of Labels can be shown above this Token and
     * another can be shown below it.
     * @param {String} category
     * @param {String} text
     */

  }, {
    key: "registerLabel",
    value: function registerLabel() {
      var category = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";
      var text = arguments.length > 1 ? arguments[1] : undefined;
      this.registeredLabels[category] = new Label(text, this);
    }
    /**
     * Returns all the categories for which a Label/LongLabel is currently
     * registered for this Token.
     */

  }, {
    key: "getLabelCategories",
    value: function getLabelCategories() {
      return Object.keys(this.registeredLabels);
    }
    /**
     * Registers a LongLabel for this Token under the given category.
     * Called when a new LongLabel is created; Parsers should not call this
     * method directly.
     * @param category
     * @param longLabel
     */

  }, {
    key: "registerLongLabel",
    value: function registerLongLabel(category, longLabel) {
      this.registeredLabels[category] = longLabel;
    }
  }]);
  return Token;
}();

exports.Token = Token;