import Token from "./components/Token";
import Link from "./components/Link";
import LongLabel from "./components/LongLabel";

/**
 * Odinson parser class
 */
class OdinsonParser {
  /**
   * The class constructor
   */
  constructor() {
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
  parse(dataObject, hiddenMentions) {
    this.reset();

    this.hiddenMentions = new Set(hiddenMentions);
    const toParse = Array.isArray(dataObject) ? dataObject[0] : dataObject;

    this.data.words = toParse.words;
    this.parsedDocuments[0] = this._parseSentence(toParse, Date.now());

    (toParse.match || toParse.matches).forEach((mention) => {
      this._parseMention({ mention, relType: toParse.label });
    });

    return this.data;
  }

  /**
   * Reinitialize all class properties.
   *
   * @private
   */
  reset() {
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
  _parseSentence(sentence, docId) {
    const thisDocument = {};
    const sentenceId = `sentence-${Date.now()}`;

    thisDocument.sentences = [];

    const createLinkInstance = (
      localDocId,
      sentenceIdLocal,
      type,
      index,
      edge,
      sentenceData
    ) => {
      return new Link(
        `${localDocId}-${sentenceIdLocal}-${type}-${index}`,
        sentenceData[edge[0]],
        [
          {
            anchor: sentenceData[edge[1]],
            type: edge[2]
          }
        ],
        edge[2],
        type
      );
    };

    const thisSentence = [];
    const sentenceFields = {};

    let sentenceGraph = null;

    for (let i = 0; i < sentence.fields.length; i += 1) {
      const field = sentence.fields[i];

      if (field.name !== "dependencies") {
        sentenceFields[field.name] = field.tokens;
      } else {
        sentenceGraph = field;
      }
    }

    for (let i = 0; i < sentenceFields.word.length; i += 1) {
      const thisToken = new Token(
        sentenceFields.word[i],
        i + this.lastTokenIdx + 1
      );

      if (sentenceFields.raw) {
        thisToken.registerLabel("raw", sentenceFields.raw[i]);
      }
      if (sentenceFields.tag) {
        thisToken.registerLabel("POS", sentenceFields.tag[i]);
      }
      if (sentenceFields.lemma) {
        thisToken.registerLabel("lemma", sentenceFields.lemma[i]);
      }
      if (sentenceFields.entity) {
        thisToken.registerLabel("entity", sentenceFields.entity[i]);
      }
      if (sentenceFields.norms) {
        thisToken.registerLabel("norm", sentenceFields.norms[i]);
      }
      if (sentenceFields.chunk) {
        thisToken.registerLabel("chunk", sentenceFields.chunk[i]);
      }

      thisSentence.push(thisToken);
      this.data.tokens.push(thisToken);
    }

    this.lastTokenIdx += sentence.numTokens;

    if (sentenceGraph) {
      for (let i = 0; i < sentenceGraph.edges.length; i += 1) {
        const edge = sentenceGraph.edges[i];

        this.data.links.push(
          createLinkInstance(
            docId,
            sentenceId,
            "universal-basic",
            i,
            edge,
            thisSentence
          )
        );

        this.data.links.push(
          createLinkInstance(
            docId,
            sentenceId,
            "universal-enhanced",
            i,
            edge,
            thisSentence
          )
        );
      }
    }

    thisDocument.sentences.push(thisSentence);

    return thisDocument;
  }

  _generateId() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return (
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  }

  _getLabelForTokens(tokens, captureTypeName) {
    if (tokens.length > 1) {
      const longLabel = LongLabel.registerLongLabel(
        "default",
        captureTypeName,
        tokens,
        ++this.longLabelIdx
      );

      return longLabel;
    } else {
      tokens[0].registerLabel("default", captureTypeName);

      return tokens[0];
    }
  }

  _parseMention({ mention, relType }) {
    const { span, captures } = mention;
    const id = `${relType}-${span.start}-${span.end}`;

    this.availableMentions.set(id, relType);

    if (this.hiddenMentions.has(id)) {
      return null;
    }

    if (this.parsedMentions[id]) {
      return this.parsedMentions[id];
    }

    const linkArgs = [];

    const spanTokens = this.data.tokens.slice(span.start, span.end);
    const trigger = this._getLabelForTokens(spanTokens, "trigger");

    captures.forEach((capture) => {
      const captureTypeNames = Object.keys(capture);

      captureTypeNames.forEach((captureTypeName) => {
        const captureType = capture[captureTypeName];
        const captureSpan = captureType.span;

        const tokens = this.data.tokens.slice(
          captureSpan.start,
          captureSpan.end
        );

        const tokenLabel = this._getLabelForTokens(tokens, captureTypeName);

        linkArgs.push({
          anchor: tokenLabel,
          type: captureTypeName
        });
      });
    });

    // Done; prepare the new Link
    const link = new Link(
      // eventId
      id,
      // Trigger
      trigger,
      // Arguments
      linkArgs,
      // Relation type
      relType
    );

    this.data.links.push(link);

    this.parsedMentions[id] = link;

    return link;
  }
}

export default OdinsonParser;
