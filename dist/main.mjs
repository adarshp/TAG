"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Main = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _lodash = _interopRequireDefault(require("lodash"));

var _jquery = _interopRequireDefault(require("jquery"));

var _svg = require("@svgdotjs/svg.js");

var _rowmanager = require("./managers/rowmanager.mjs");

var _taxonomy = require("./managers/taxonomy.mjs");

var _config = require("./config.mjs");

var _util = require("./util.mjs");

var _word = require("./components/word.mjs");

var _wordCluster = require("./components/word-cluster.mjs");

var _link = require("./components/link.mjs");

var _autobindDecorator = require("autobind-decorator");

var _class;

var Main = (0, _autobindDecorator.boundClass)(_class = /*#__PURE__*/function () {
  /**
   * Initialises a TAG instance with the given parameters
   * @param {String|Element|jQuery} container - Either a string containing the
   *     ID of the container element, or the element itself (as a
   *     native/jQuery object)
   * @param {Object} options - Overrides for default library options
   * @param {Object} parsers - Registered parsers for various annotation formats
   */
  function Main(container) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var parsers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck2["default"])(this, Main);
    // Config options
    this.config = _lodash["default"].defaults(options, new _config.Config()); // SVG.Doc expects either a string with the element's ID, or the element
    // itself (not a jQuery object).

    if (_lodash["default"].hasIn(container, "jquery")) {
      container = container[0];
    }

    this.svg = new _svg.SVG.Doc(container); // That said, we need to set the SVG Doc's size using absolute units
    // (since they are used for calculating the widths of rows and other
    // elements).  We use jQuery to get the parent's size.

    this.$container = (0, _jquery["default"])(this.svg.node).parent(); // Managers/Components

    this.rowManager = new _rowmanager.RowManager(this.svg, this.config);
    this.labelManager = new LabelManager(this.svg);
    this.taxonomyManager = new _taxonomy.Taxonomy(this.config); // Registered Parsers

    this.parsers = parsers;
    this.parsedData = null; // Tokens and links that are currently drawn on the visualisation

    this.words = [];
    this.links = [];
    this.wordClusters = [];
    this.mentions = new Map();
    this.hiddenMentions = new Set();
    this.hiddenMentionsTree = {};
    this.dataObjects = null; // Initialisation

    this.resize();

    this._setupSVGListeners();

    this._setupUIListeners();
  } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // Loading data into the parser

  /**
   * Loads the given annotation data onto the TAG visualisation
   * @param {Array} dataObjects - The raw annotation data object(s) to load
   * @param {String} format - One of the supported format identifiers for
   *     the data
   */


  (0, _createClass2["default"])(Main, [{
    key: "loadData",
    value: function loadData(dataObjects, format) {
      var hiddenMentions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      // 1) Remove any currently-loaded data
      // 2) Parse the new data
      // 3) Hand-off the parsed data to the SVG initialisation procedure
      if (!_lodash["default"].has(this.parsers, format)) {
        throw "No parser registered for annotation format: ".concat(format);
      }

      this.clear();
      this.hiddenMentions = new Set(hiddenMentions);
      this.dataObjects = dataObjects;
      this.parsedDataFormat = format;

      this._parseData();

      this.svgListeners = {};
      this.init();
      this.draw();
    }
  }, {
    key: "_parseData",
    value: function _parseData() {
      this.parsedData = this.parsers[this.parsedDataFormat].parse(this.dataObjects, this.hiddenMentions);

      if (this.parsers[this.parsedDataFormat].availableMentions) {
        this.mentions = this.parsers[this.parsedDataFormat].availableMentions;
      }
    }
  }, {
    key: "_hideMention",
    value: function _hideMention(mention, parent) {
      if (this.parsers[this.parsedDataFormat].parsedMentions[mention]) {
        this.hiddenMentions.add(mention);
        this.hiddenMentionsTree[parent].push(mention);
      }
    }
  }, {
    key: "toggleMention",
    value: function toggleMention(mention) {
      var _this = this;

      if (!this.mentions.has(mention)) {
        return false;
      }

      if (this.hiddenMentions.has(mention)) {
        this.hiddenMentions["delete"](mention);
        this.hiddenMentionsTree[mention].forEach(function (childMention) {
          _this.hiddenMentions["delete"](childMention);
        });
        delete this.hiddenMentionsTree[mention];
      } else {
        this.hiddenMentionsTree[mention] = [];

        this._hideMention(mention, mention);
      }

      this.clear();

      this._parseData();

      this.svgListeners = {};
      this.init();
      this.draw();
    }
    /**
     * Reads the given data file asynchronously and loads it onto the TAG
     * visualisation
     * @param {Object} path - The path pointing to the data
     * @param {String} format - One of the supported format identifiers for
     *     the data
     */

  }, {
    key: "loadUrlAsync",
    value: function () {
      var _loadUrlAsync = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(path, format) {
        var hiddenMentions,
            data,
            _args = arguments;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                hiddenMentions = _args.length > 2 && _args[2] !== undefined ? _args[2] : [];
                _context.next = 3;
                return _jquery["default"].ajax(path);

              case 3:
                data = _context.sent;
                this.loadData([data], format, hiddenMentions);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function loadUrlAsync(_x, _x2) {
        return _loadUrlAsync.apply(this, arguments);
      }

      return loadUrlAsync;
    }()
    /**
     * Reads the given annotation files and loads them onto the TAG
     * visualisation
     * @param {FileList} fileList - We generally expect only one file here, but
     *     some formats (e.g., Brat) involve multiple files per dataset
     * @param {String} format
     */

  }, {
    key: "loadFilesAsync",
    value: function () {
      var _loadFilesAsync = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(fileList, format) {
        var readPromises, files;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // Instantiate FileReaders for all the given files, and wait until they
                // are read
                readPromises = _lodash["default"].map(fileList, function (file) {
                  var reader = new FileReader();
                  reader.readAsText(file);
                  return new Promise(function (resolve) {
                    reader.onload = function () {
                      resolve({
                        name: file.name,
                        type: file.type,
                        content: reader.result
                      });
                    };
                  });
                });
                _context2.next = 3;
                return Promise.all(readPromises);

              case 3:
                files = _context2.sent;
                this.loadData(files, format);

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadFilesAsync(_x3, _x4) {
        return _loadFilesAsync.apply(this, arguments);
      }

      return loadFilesAsync;
    }() // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Controlling the SVG element

    /**
     * Prepares all the Rows/Words/Links.
     * Adds all Words/WordClusters to Rows in the visualisation, but does not draw
     * Links or colour the various Words/WordTags
     */

  }, {
    key: "init",
    value: function init() {
      var _this2 = this;

      // Convert the parsed data into visualisation objects (by adding
      // SVG/visualisation-related data and methods)
      // TODO: Refactor the Word/WordTag/WordCluster/Link system instead of
      //  patching it here.
      // Tokens -> Words
      // Labels -> WordTags
      // Records LongLabels to convert later.
      this.words = [];
      this.wordClusters = [];
      var longLabels = [];
      this.parsedData.tokens.forEach(function (token) {
        // Basic
        var word = new _word.Word(token);

        _this2.words.push(word);

        _lodash["default"].forOwn(token.registeredLabels, function (label, category) {
          if (_lodash["default"].has(label, "token")) {
            // Label
            word.registerTag(category, label);
          } else if (_lodash["default"].has(label, "tokens")) {
            // LongLabel
            if (longLabels.indexOf(label) < 0) {
              longLabels.push(label);
            }
          }
        });
      }); // LongLabels -> WordClusters
      // (via back-references)
      // N.B.: Assumes that the `.idx` property of each Word is equal to its
      // index in `this.words`.

      longLabels.forEach(function (longLabel) {
        var labelWords = [];

        for (var x = 0; x < longLabel.tokens.length; x++) {
          var wordIdx = longLabel.tokens[x].idx;
          labelWords.push(_this2.words[wordIdx]);
        }

        _this2.wordClusters.push(new _wordCluster.WordCluster(labelWords, longLabel.val));
      }); // Links
      // Arguments might be Tokens or (Parser) Links; convert them to Words
      // and Links.
      // N.B.: Assumes that nested Links are parsed earlier in the array.

      this.links = [];
      var linksById = {};
      this.parsedData.links.forEach(function (link) {
        var newTrigger = null;
        var newArgs = [];

        if (link.trigger) {
          // Assume the trigger is a Token
          newTrigger = _this2.words[link.trigger.idx];
        } // noinspection JSAnnotator


        link.arguments.forEach(function (arg) {
          if (arg.anchor.type === "Token") {
            newArgs.push({
              anchor: _this2.words[arg.anchor.idx],
              type: arg.type
            });
          } else if (arg.anchor.type === "Link") {
            newArgs.push({
              anchor: linksById[arg.anchor.eventId],
              type: arg.type
            });
          } else if (arg.anchor.type === "LongLabel") {
            newArgs.push({
              anchor: _this2.wordClusters[arg.anchor.idx],
              type: arg.type
            });
          }
        });
        var newLink = new _link.Link(link.eventId, newTrigger, newArgs, link.relType, link.category === "default", link.category);

        _this2.links.push(newLink);

        linksById[newLink.eventId] = newLink;
      }); // Calculate the Link slots (vertical intervals to separate
      // crossing/intervening Links).
      // Because the order of the Links array affects the slot calculations,
      // we sort it here first in case they aren't sorted in the original
      // annotation data.

      this.links = (0, _util.sortForSlotting)(this.links);
      this.links.forEach(function (link) {
        return link.calculateSlot(_this2.words);
      }); // Initialise the first Row; new ones will be added automatically as
      // Words are drawn onto the visualisation

      if (this.words.length > 0 && !this.rowManager.lastRow) {
        this.rowManager.appendRow();
      } // Draw the Words onto the visualisation


      this.words.forEach(function (word) {
        // If the tag categories to show for the Word are already set (via the
        // default config or user options), set them here so that the Word can
        // draw them directly on init
        _this2.config.topTagCategories.forEach(function (category) {
          word.setTopTagCategory(category);
        });

        _this2.config.bottomTagCategories.forEach(function (category) {
          word.setBottomTagCategory(category);
        });

        word.init(_this2);

        _this2.rowManager.addWordToRow(word, _this2.rowManager.lastRow);
      }); // We have to initialise all the Links before we draw any of them, to
      // account for nested Links etc.

      this.links.forEach(function (link) {
        link.init(_this2);
      });
    }
    /**
     * Resizes Rows and (re-)draws Links and WordClusters, without changing
     * the positions of Words/Link handles
     */

  }, {
    key: "draw",
    value: function draw() {
      var _this3 = this;

      // Draw in the currently toggled Links
      this.links.forEach(function (link) {
        if (link.top && link.category === _this3.config.topLinkCategory || !link.top && link.category === _this3.config.bottomLinkCategory) {
          link.show();
        }

        if (link.top && _this3.config.showTopMainLabel || !link.top && _this3.config.showBottomMainLabel) {
          link.showMainLabel();
        } else {
          link.hideMainLabel();
        }

        if (link.top && _this3.config.showTopArgLabels || !link.top && _this3.config.showBottomArgLabels) {
          link.showArgLabels();
        } else {
          link.hideArgLabels();
        }
      }); // Now that Links are visible, make sure that all Rows have enough space

      this.rowManager.resizeAll(); // And change the Row resize cursor if compact mode is on

      this.rowManager.rows.forEach(function (row) {
        _this3.config.compactRows ? row.draggable.addClass("row-drag-compact") : row.draggable.removeClass("row-drag-compact");
      }); // Change token colours based on the current taxonomy, if loaded

      this.taxonomyManager.colour(this.words);
    }
    /**
     * Removes all elements from the visualisation
     */

  }, {
    key: "clear",
    value: function clear() {
      // Removing Rows takes care of Words and WordTags
      while (this.rowManager.rows.length > 0) {
        this.rowManager.removeLastRow();
      } // Links and Clusters are drawn directly on the main SVG document


      this.links.forEach(function (link) {
        return link.svg && link.svg.remove();
      });
      this.words.forEach(function (word) {
        word.clusters.forEach(function (cluster) {
          return cluster.remove();
        });
      }); // Reset colours

      this.taxonomyManager.resetDefaultColours();
    }
    /**
     * Fits the SVG element and its children to the size of its container
     */

  }, {
    key: "resize",
    value: function resize() {
      this.svg.size(this.$container.innerWidth(), this.$container.innerHeight());
      this.rowManager.resizeAll();
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Controlling taxonomic information and associated colours

    /**
     * Loads a new taxonomy specification (in YAML form) into the module
     * @param {String} taxonomy - A YAML string representing the taxonomy object
     */

  }, {
    key: "loadTaxonomyYaml",
    value: function loadTaxonomyYaml(taxonomy) {
      return this.taxonomyManager.loadTaxonomyYaml(taxonomy);
    }
    /**
     * Returns a YAML representation of the currently loaded taxonomy
     */

  }, {
    key: "getTaxonomyYaml",
    value: function getTaxonomyYaml() {
      return this.taxonomyManager.getTaxonomyYaml();
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
      return this.taxonomyManager.getTaxonomyTree();
    }
    /**
     * Given some label (either for a WordTag or WordCluster), return the
     * colour that the taxonomy manager has assigned to it
     * @param label
     */

  }, {
    key: "getColour",
    value: function getColour(label) {
      return this.taxonomyManager.getColour(label);
    }
    /**
     * Sets the colour for some label (either for a WordTag or WordCluster)
     * and redraws the visualisation
     * @param label
     * @param colour
     */

  }, {
    key: "setColour",
    value: function setColour(label, colour) {
      this.taxonomyManager.assignColour(label, colour);
      this.taxonomyManager.colour(this.words);
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Higher-level API functions

    /**
     * Exports the current visualisation as an SVG file
     */

  }, {
    key: "exportSvg",
    value: function exportSvg() {
      // Get the raw SVG definition
      var exportedSVG = this.svg.svg(); // We also need to inline a copy of the relevant SVG styles, which might
      // have been modified/overwritten by the user

      var svgRules = (0, _util.getCssRules)(this.$container.find(".tag-element").toArray());
      var i = exportedSVG.indexOf("</defs>");
      exportedSVG = exportedSVG.slice(0, i) + "<style>" + svgRules.join("\n") + "</style>" + exportedSVG.slice(i); // Create a virtual download link and simulate a click on it (using the
      // native `.click()` method, since jQuery cannot `.trigger()` it

      (0, _jquery["default"])("<a\n      href=\"data:image/svg+xml;charset=utf-8,".concat(encodeURIComponent(exportedSVG), "\"\n      download=\"tag.svg\"></a>")).appendTo((0, _jquery["default"])("body"))[0].click();
    }
    /**
     * Changes the value of the given option setting
     * (Redraw to see changes)
     * @param {String} option
     * @param value
     */

  }, {
    key: "setOption",
    value: function setOption(option, value) {
      this.config[option] = value;
    }
    /**
     * Gets the current value for the given option setting
     * @param {String} option
     */

  }, {
    key: "getOption",
    value: function getOption(option) {
      return this.config[option];
    }
    /**
     * Returns an Array of all the categories available for the top Links
     * (Generally, event/relation annotations)
     */

  }, {
    key: "getTopLinkCategories",
    value: function getTopLinkCategories() {
      var categories = this.links.filter(function (link) {
        return link.top;
      }).map(function (link) {
        return link.category;
      });
      return _lodash["default"].uniq(categories);
    }
    /**
     * Shows the specified category of top Links, hiding the others
     * @param category
     */

  }, {
    key: "setTopLinkCategory",
    value: function setTopLinkCategory(category) {
      this.setOption("topLinkCategory", category);
      this.links.filter(function (link) {
        return link.top;
      }).forEach(function (link) {
        if (link.category === category) {
          link.show();
        } else {
          link.hide();
        }
      }); // Always resize when the set of visible Links may have changed

      this.rowManager.resizeAll();
    }
    /**
     * Returns an Array of all the categories available for the bottom Links
     * (Generally, syntactic/dependency parses)
     */

  }, {
    key: "getBottomLinkCategories",
    value: function getBottomLinkCategories() {
      var categories = this.links.filter(function (link) {
        return !link.top;
      }).map(function (link) {
        return link.category;
      });
      return _lodash["default"].uniq(categories);
    }
    /**
     * Shows the specified category of bottom Links, hiding the others
     * @param category
     */

  }, {
    key: "setBottomLinkCategory",
    value: function setBottomLinkCategory(category) {
      this.setOption("bottomLinkCategory", category);
      this.links.filter(function (link) {
        return !link.top;
      }).forEach(function (link) {
        if (link.category === category) {
          link.show();
        } else {
          link.hide();
        }
      }); // Always resize when the set of visible Links may have changed

      this.rowManager.resizeAll();
    }
    /**
     * Returns an Array of all the categories available for top Word tags
     * (Generally, text-bound mentions)
     */

  }, {
    key: "getTagCategories",
    value: function getTagCategories() {
      var categories = this.words.flatMap(function (word) {
        return word.getTagCategories();
      });
      return _lodash["default"].uniq(categories);
    }
    /**
     * Shows the specified category of top Word tags
     * @param category
     */

  }, {
    key: "setTopTagCategory",
    value: function setTopTagCategory(category) {
      if (category in this.config.topTagCategories) {
        return;
      }

      this.config.topTagCategories.push(category);
      this.words.forEach(function (word) {
        word.setTopTagCategory(category);
        word.passingLinks.forEach(function (link) {
          return link.draw();
        });
      }); // (Re-)colour the labels

      this.taxonomyManager.colour(this.words); // Always resize when the set of visible Links may have changed

      this.rowManager.resizeAll();
    }
  }, {
    key: "removeTopTagCategory",
    value: function removeTopTagCategory(category) {
      this.config.topTagCategories = this.config.topTagCategories.filter(function (topCategory) {
        return topCategory !== category;
      });
      this.words.forEach(function (word) {
        word.removeTopTagCategory(category);
        word.passingLinks.forEach(function (link) {
          return link.draw();
        });
      }); // (Re-)colour the labels

      this.taxonomyManager.colour(this.words); // Always resize when the set of visible Links may have changed

      this.rowManager.resizeAll();
    }
    /**
     * Shows the specified category of bottom Word tags
     * @param category
     */

  }, {
    key: "setBottomTagCategory",
    value: function setBottomTagCategory(category) {
      if (category in this.config.bottomTagCategories) {
        return;
      }

      this.config.bottomTagCategories.push(category);
      this.words.forEach(function (word) {
        word.setBottomTagCategory(category);
        word.passingLinks.forEach(function (link) {
          return link.draw();
        });
      }); // Always resize when the set of visible Links may have changed

      this.rowManager.resizeAll();
    }
  }, {
    key: "removeBottomTagCategory",
    value: function removeBottomTagCategory(category) {
      this.config.bottomTagCategories = this.config.bottomTagCategories.filter(function (bottomCategory) {
        return bottomCategory !== category;
      });
      this.words.forEach(function (word) {
        word.removeBottomTagCategory(category);
        word.passingLinks.forEach(function (link) {
          return link.draw();
        });
      });
      this.rowManager.resizeAll();
    }
    /**
     * Shows/hides the main label on top Links
     * @param {Boolean} visible - Show if true, hide if false
     */

  }, {
    key: "setTopMainLabelVisibility",
    value: function setTopMainLabelVisibility(visible) {
      this.setOption("showTopMainLabel", visible);

      if (visible) {
        this.links.filter(function (link) {
          return link.top;
        }).forEach(function (link) {
          return link.showMainLabel();
        });
      } else {
        this.links.filter(function (link) {
          return link.top;
        }).forEach(function (link) {
          return link.hideMainLabel();
        });
      }
    }
    /**
     * Shows/hides the argument labels on top Links
     * @param {Boolean} visible - Show if true, hide if false
     */

  }, {
    key: "setTopArgLabelVisibility",
    value: function setTopArgLabelVisibility(visible) {
      this.setOption("showTopArgLabels", visible);

      if (visible) {
        this.links.filter(function (link) {
          return link.top;
        }).forEach(function (link) {
          return link.showArgLabels();
        });
      } else {
        this.links.filter(function (link) {
          return link.top;
        }).forEach(function (link) {
          return link.hideArgLabels();
        });
      }
    }
    /**
     * Shows/hides the main label on bottom Links
     * @param {Boolean} visible - Show if true, hide if false
     */

  }, {
    key: "setBottomMainLabelVisibility",
    value: function setBottomMainLabelVisibility(visible) {
      this.setOption("showBottomMainLabel", visible);

      if (visible) {
        this.links.filter(function (link) {
          return !link.top;
        }).forEach(function (link) {
          return link.showMainLabel();
        });
      } else {
        this.links.filter(function (link) {
          return !link.top;
        }).forEach(function (link) {
          return link.hideMainLabel();
        });
      }
    }
    /**
     * Shows/hides the argument labels on bottom Links
     * @param {Boolean} visible - Show if true, hide if false
     */

  }, {
    key: "setBottomArgLabelVisibility",
    value: function setBottomArgLabelVisibility(visible) {
      this.setOption("showBottomArgLabels", visible);

      if (visible) {
        this.links.filter(function (link) {
          return !link.top;
        }).forEach(function (link) {
          return link.showArgLabels();
        });
      } else {
        this.links.filter(function (link) {
          return !link.top;
        }).forEach(function (link) {
          return link.hideArgLabels();
        });
      }
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Private helper/setup functions

    /**
     * Sets up listeners for custom SVG.js events
     * N.B.: Event listeners will change the execution context by default, so
     * either provide a closure to the main library instance or use arrow
     * functions to preserve the original context
     * cf. http://es6-features.org/#Lexicalthis
     * @private
     */

  }, {
    key: "_setupSVGListeners",
    value: function _setupSVGListeners() {
      var _this4 = this;

      this.svg.on("row-resize", function (event) {
        _this4.labelManager.stopEditing();

        _this4.rowManager.resizeRow(event.detail.object.idx, event.detail.y);
      });
      this.svg.on("label-updated", function (e) {
        _this4.svgListeners["label-updated"].forEach(function (listener) {
          listener.call(_this4, _this4.parsedData);
        }); // // TODO: so so incomplete
        // let color = tm.getColor(e.detail.label, e.detail.object);
        // e.detail.object.node.style.fill = color;

      });
      this.svg.on("word-move-start", function () {
        _this4.links.forEach(function (link) {
          if (link.top && !_this4.config.showTopLinksOnMove || !link.top && !_this4.config.showBottomLinksOnMove) {
            link.hide();
          }
        });
      });
      this.svg.on("word-move", function (event) {
        // tooltip.clear();
        _this4.labelManager.stopEditing();

        _this4.rowManager.moveWordOnRow(event.detail.object, event.detail.x);
      });
      this.svg.on("word-move-end", function () {
        _this4.links.forEach(function (link) {
          if (link.top && link.category === _this4.config.topLinkCategory || !link.top && link.category === _this4.config.bottomLinkCategory) {
            link.show();
          }
        });
      });
      this.svg.on("link-dbl-click", function (evt) {
        var eventId = evt.detail.object.eventId;

        _this4.toggleMention(eventId);

        var mentionEvt = new Event("refresh-mentions");
        window.dispatchEvent(mentionEvt);
      }); // this.svg.on("tag-remove", (event) => {
      //   event.detail.object.remove();
      //   this.taxonomyManager.remove(event.detail.object);
      // });
      // this.svg.on("row-recalculate-slots", () => {
      //   this.links.forEach(link => {
      //     link.slot = null;
      //   });
      //   this.links = sortForSlotting(this.links);
      //   this.links.forEach(link => link.calculateSlot(this.words));
      //   this.links.forEach(link => link.draw());
      // });
      // ZW: Hardcoded dependencies on full UI
      // this.svg.on("build-tree", (event) => {
      //   document.body.classList.remove("tree-closed");
      //   if (tree.isInModal) {
      //     setActiveTab("tree");
      //   }
      //   else {
      //     setActiveTab(null);
      //   }
      //   if (e.detail) {
      //     tree.graph(e.detail.object);
      //   }
      //   else {
      //     tree.resize();
      //   }
      // });
    }
    /**
     * Sets up listeners for general browser events
     * @private
     */

  }, {
    key: "_setupUIListeners",
    value: function _setupUIListeners() {
      var _this5 = this;

      // Browser window resize
      (0, _jquery["default"])(window).on("resize", _lodash["default"].throttle(function () {
        _this5.resize();
      }, 50));
    } // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // Debug functions

  }, {
    key: "xLine",
    value: function xLine(x) {
      this.svg.line(x, 0, x, 1000).stroke({
        width: 1
      });
    }
  }, {
    key: "yLine",
    value: function yLine(y) {
      this.svg.line(0, y, 1000, y).stroke({
        width: 1
      });
    }
  }, {
    key: "addSvgListener",
    value: function addSvgListener(svgEvent, listener) {
      if (svgEvent in this.svgListeners) {
        this.svgListeners[svgEvent].push(listener);
      } else {
        this.svgListeners[svgEvent] = [listener];
      }
    }
  }]);
  return Main;
}()) || _class;

exports.Main = Main;