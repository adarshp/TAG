"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TaxonomyManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _lodash = _interopRequireDefault(require("lodash"));

var _randomcolor = _interopRequireDefault(require("randomcolor"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _word = require("../components/word.mjs");

/**
 * Manages the user-provided taxonomy tree, and the colouring of the
 * associated elements in the visualisation
 */
var TaxonomyManager = /*#__PURE__*/function () {
  function TaxonomyManager(config) {
    (0, _classCallCheck2["default"])(this, TaxonomyManager);
    // The global Config object
    this.config = config; // The currently loaded taxonomy (as a JS Array representing the tree)

    this.taxonomy = []; // The originally-loaded taxonomy string (as a YAML document)

    this.taxonomyYaml = ""; // Tag->Colour assignments for the currently loaded taxonomy

    this.tagColours = {}; // An array containing the first n default colours to use (as a queue).
    // When this array is exhausted, we will switch to using randomColor.

    this.defaultColours = _lodash["default"].cloneDeep(config.tagDefaultColours);
  }
  /**
   * Loads a new taxonomy specification (in YAML form) into the module
   * @param {String} taxonomyYaml - A YAML string representing the taxonomy
   *   object
   */


  (0, _createClass2["default"])(TaxonomyManager, [{
    key: "loadTaxonomyYaml",
    value: function loadTaxonomyYaml(taxonomyYaml) {
      this.taxonomy = _jsYaml["default"].safeLoad(taxonomyYaml);
      this.taxonomyYaml = taxonomyYaml;
    }
    /**
     * Returns a YAML representation of the currently loaded taxonomy
     */

  }, {
    key: "getTaxonomyYaml",
    value: function getTaxonomyYaml() {
      return this.taxonomyYaml;
    }
    /**
     * Returns the currently loaded taxonomy as an Array.
     * Simple labels are stored as Strings in Arrays, and category labels are
     * stored as single-key objects.
     *
     * E.g., a YAML document like the following:
     *
     *  - Label A
     *  - Category 1:
     *    - Label B
     *    - Label C
     *  - Label D
     *
     * Parses to the following taxonomy object:
     *
     *  [
     *    "Label A",
     *    {
     *      "Category 1": [
     *        "Label B",
     *        "Label C"
     *      ]
     *    },
     *    "Label D"
     *  ]
     *
     * @return {Array}
     */

  }, {
    key: "getTaxonomyTree",
    value: function getTaxonomyTree() {
      return this.taxonomy;
    }
    /**
     * Given some array of Words, recolours them according to the currently
     * loaded taxonomy.
     * If the word has a WordTag that we are not currently tracking, it will
     * be assigned a colour from the default colours list.
     * @param {Array} words
     */

  }, {
    key: "colour",
    value: function colour(words) {
      var _this = this;

      words.forEach(function (word) {
        // Words with WordTags
        if (word.topTag) {
          if (!_this.tagColours[word.topTag.val]) {
            // We have yet to assign this tag a colour
            _this.assignColour(word.topTag.val, _this.getNewColour());
          }

          TaxonomyManager.setColour(word, _this.tagColours[word.topTag.val]);
        } // Words with WordClusters


        if (word.clusters.length > 0) {
          word.clusters.forEach(function (cluster) {
            if (!_this.tagColours[cluster.val]) {
              _this.assignColour(cluster.val, _this.getNewColour());
            }

            TaxonomyManager.setColour(cluster, _this.tagColours[cluster.val]);
          });
        }
      });
    }
    /**
     * Synonym for `.colour()`
     * @param words
     * @return {*}
     */

  }, {
    key: "color",
    value: function color(words) {
      return this.colour(words);
    }
    /**
     * Given some label in the visualisation (either for a WordTag or a
     * WordCluster), assigns it a colour that will be reflected the next time
     * `.colour()` is called.
     */

  }, {
    key: "assignColour",
    value: function assignColour(label, colour) {
      this.tagColours[label] = colour;
    }
    /**
     * Given some element in the visualisation, change its colour
     * @param element
     * @param colour
     */

  }, {
    key: "getColour",
    value:
    /**
     * Given some label (either for a WordTag or WordCluster), return the
     * colour that the taxonomy manager has assigned to it
     * @param label
     */
    function getColour(label) {
      return this.tagColours[label];
    }
    /**
     * Returns a colour for a new tag.  Will pop from `.defaultColours` first,
     * then fall back to `randomColor()`
     */

  }, {
    key: "getNewColour",
    value: function getNewColour() {
      if (this.defaultColours.length > 0) {
        return this.defaultColours.shift();
      } else {
        return (0, _randomcolor["default"])();
      }
    }
    /**
     * Resets `.defaultColours` to the Array specified in the Config object
     * (Used when clearing the visualisation, for example)
     */

  }, {
    key: "resetDefaultColours",
    value: function resetDefaultColours() {
      this.defaultColours = _lodash["default"].cloneDeep(this.config.tagDefaultColours);
    }
  }], [{
    key: "setColour",
    value: function setColour(element, colour) {
      if (element instanceof _word.Word) {
        // Set the colour of the tag
        element.topTag.svgText.node.style.fill = colour;
      } else {
        // Set the colour of the element itself
        element.svgText.node.style.fill = colour;
      }
    }
  }]);
  return TaxonomyManager;
}();

exports.TaxonomyManager = TaxonomyManager;