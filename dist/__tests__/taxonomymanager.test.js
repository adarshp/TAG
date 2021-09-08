"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

var fs = _interopRequireWildcard(require("fs"));

var _taxonomy = _interopRequireDefault(require("../js/managers/taxonomy.js"));

var _config = _interopRequireDefault(require("../js/config.js"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Test taxonomy manager
 */
describe("The TaxonomyManager", function () {
  it("should load an Odin taxonomy (yaml string)", function () {
    var yamlData = fs.readFileSync("./src/__tests__/data/taxonomy.yml", "utf8");
    var conf = new _config["default"](); // Initialize TaxonomyManager and load data

    var taxman = new _taxonomy["default"](conf);
    taxman.loadTaxonomyYaml(yamlData);
    var tree = taxman.getTaxonomyTree();
    expect(JSON.stringify(tree)).toMatchSnapshot();
  });
});