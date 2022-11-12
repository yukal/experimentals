'use strict';

const Parsers = require('./parsers');

const TAG_SINGLE = 0;
const TAG_OPENED = 1;
const TAG_CLOSED = 2;

const REG_TAGS = /<([^\s>=<]+)(.*?)>/s;
const REG_XML_HEAD = /<\?xml\s*(.*?)\?>/is;
const REG_ATTRIBUTES = /(?<key>[:\w-]+)\s*=\s*["'](?<val>(?:[^<&"]|(?:&[a-z]+;|&#\d+;|&#x[0-9a-f];))*)['"]/si;

function* DocumentReader(documentText, options = {}) {
  const { openTagAttrPrefix = '@' } = options;
  let matches = REG_TAGS.exec(documentText);

  while (matches !== null) {
    const [wholeMatch, matchTag, matchParams] = matches;

    const text = documentText.slice(0, matches.index).replace(/^\s+$/, '');
    const lastPosition = matches.index + wholeMatch.length;

    documentText = documentText.slice(lastPosition);

    if (wholeMatch.startsWith('<!--')) {
      if (!wholeMatch.endsWith('-->')) {
        const index = documentText.indexOf('-->');

        if (index > -1) {
          documentText = documentText.slice(index + 3);
        } else {
          throw new Error('comment not closed');
        }
      }

      matches = REG_TAGS.exec(documentText);
      continue;
    }

    // const isSingleTag = wholeMatch.endsWith('/>') || (wholeMatch.startsWith('<?') && wholeMatch.endsWith('?>'));
    const isSingleTag = wholeMatch.endsWith('/>');
    const isPairedClosedTag = wholeMatch.startsWith('</');
    const tagName = matchTag.replace(/[^\w:]+/g, '');

    if (isSingleTag) {

      const attributes = parseAttributes(matchParams);
      yield { tagType: TAG_SINGLE, tagName, attributes, text };

    } else if (isPairedClosedTag) {

      yield { tagType: TAG_CLOSED, tagName, text };

    } else {

      const attributes = parseAttributes(matchParams, openTagAttrPrefix);
      yield { tagType: TAG_OPENED, tagName, attributes, text };

    }

    matches = REG_TAGS.exec(documentText);
  }
}

const HtmlReader = (documentText) => ({
  xpath(path) { },
});

const parseAttributes = (params, prefix = '') => {
  const attributes = {};
  let matches = REG_ATTRIBUTES.exec(params);
  let length = 0;

  while (matches !== null) {
    const [row, key, val] = matches;
    const keyName = prefix + key;

    params = params.slice(matches.index + row.length);
    matches = REG_ATTRIBUTES.exec(params);

    // attributes[key] = val.slice(1, -1);
    attributes[keyName] = val;
    length++;
  }

  return Object.defineProperty(attributes, 'attrsLength', { value: length });
};

const initTree = (root) => {
  let length = 0;
  const stack = {
    [length]: {
      tagName: ':root:',
      text: '',
      attributes: root,
      hasTags: false,
      data: { ...root },
    }
  };

  const StackInterface = {
    open(item) {
      stack[length].hasTags = true;

      // stack[length].data[item.tagName] = data;
      // stack[++length] = { ...item, data };
      stack[++length] = { ...item, hasTags: false, data: {} };

      return StackInterface;
      // return length;
    },

    close(item) {
      if (item.tagName === stack[length].tagName) {
        delete stack[length--];
      }

      return StackInterface;
      // return length;
    },

    inContext(tagName) {
      return tagName == stack[length].tagName;
    },

    getCurr() {
      return stack[length];
    },

    getPrev() {
      return stack[length - 1];
    },

    getItem(num) {
      return num < 0 ? stack[length + num] : stack[num];
    },

    getData() {
      return stack[0].data;
    },

    get size() {
      return length;
    },
  };

  return StackInterface;
};

const compressToCanonicalText = (xmlText) => {
  return xmlText.replace(/\s+(<)|(>)\s+/g, (match, val2, val3) => val2 || val3);
};

const parse = (documentText, options = {}) => {
  documentText = compressToCanonicalText(documentText);

  if (!options.hasOwnProperty('openTagAttrPrefix')) {
    options.openTagAttrPrefix = '@';
  }

  let root = {};
  let matches = REG_XML_HEAD.exec(documentText);

  if (matches !== null) {
    const [wholeMatch, matchParams] = matches;

    const text = documentText.slice(0, matches.index).replace(/^\s+$/, '');
    const lastPosition = matches.index + wholeMatch.length;

    root = parseAttributes(matchParams, options.openTagAttrPrefix);
    documentText = documentText.slice(lastPosition);
  }

  const tree = initTree(root);
  const documentReader = DocumentReader(documentText, options);

  for (const item of documentReader) {

    const parser = Parsers[item.tagType];
    parser(tree, item);

  }

  return tree.getData();
};

const isEmptyObject = (object) => {
  for (const item in object) {
    return true;
  }

  return false;
};

module.exports = Object.freeze({
  TAG_SINGLE,
  TAG_OPENED,
  TAG_CLOSED,

  parse,
  compressToCanonicalText,
  DocumentReader,
  HtmlReader,
});
