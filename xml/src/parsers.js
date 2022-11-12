'use strict';

const Type = (obj) => {
  const signature = Object.prototype.toString.call(obj);
  return signature.slice(8, -1).toLowerCase();
}

const convertDataToArray = (entity) => {
  let items = [];

  switch (Type(entity)) {
    case 'string':
      return [entity];
      break;

    case 'array':
      return [entity];
      break;

    case 'object':
      const keys = Object.keys(entity);

      for (const tagName of keys) {

        if (Array.isArray(entity[tagName])) {

          const convertedItems = entity[tagName].map((item) => {
            if (Type(item) === 'string') {
              return { tagName, text: item }
            }

            if (Type(item) === 'object') {
              return { tagName, ...item };
            }
          });

          items = items.concat(convertedItems);

        } else if (Type(entity[tagName]) === 'object') {

          items.push({ tagName, ...entity[tagName], });

        } else if (Type(entity[tagName]) === 'string') {

          items.push({ tagName, text: entity[tagName] });

        }

      }
      break;

    default:
      break;
  }

  return items;
};

const parseSingleTag = (tree, item) => {
  const { tagName, attributes, text } = item;

  const prev = tree.getPrev();
  const curr = tree.getCurr();
  const currDataType = Type(curr.data);

  curr.hasTags = true;

  switch (currDataType) {
    case 'object':
      if (text.length) {
        const currData = { tagName, ...attributes };

        curr.data = convertDataToArray(curr.data);
        curr.data.push(text, currData);
        prev.data[curr.tagName] = curr.data;

      } else if (curr.data.hasOwnProperty(tagName)) {

        const currItem = curr.data[tagName];

        if (Array.isArray(currItem)) {

          // const currData = { tagName, ...attributes };
          currItem.push(attributes);

        } else {

          curr.data[tagName] = [currItem, attributes];

        }

      } else {

        curr.data[tagName] = { ...attributes };

      }
      break;

    case 'array':

      const currData = { tagName, ...attributes };
      text.length
        ? curr.data.push(text, currData)
        : curr.data.push(currData);

      break;
  }
};

const parseOpenedTag = (tree, item) => {
  tree.open(item);

  const { tagName, attributes, text } = item;
  const prev = tree.getPrev();
  const curr = tree.getCurr();

  const prevDataType = Type(prev.data);

  switch (prevDataType) {
    case 'object':
      if (text.length) {

        const parent = tree.getItem(-2);
        const prevData = convertDataToArray(prev.data);

        curr.data = { tagName, ...attributes };
        prev.data = prevData.concat(text, curr.data);

        parent.data[prev.tagName] = prev.data;

      } else if (prev.data.hasOwnProperty(tagName)) {

        if (Array.isArray(prev.data[tagName])) {

          // curr.data = { tagName, ...attributes };
          curr.data = attributes;
          prev.data[tagName].push(curr.data);

        } else if (Type(prev.data[tagName]) === 'string') {

          const copy = prev.data[tagName];

          curr.data = attributes;
          prev.data[tagName] = [copy, curr.data];

        } else {

          const parent = tree.getItem(-2);
          const copy = prev.data[tagName];

          curr.data = attributes;
          prev.data[tagName] = [copy, curr.data];

          parent.data[prev.tagName] = prev.data;
        }

      } else {

        prev.data[tagName] = curr.data = attributes;

      }
      break;

    case 'array':
      curr.data = { tagName, ...attributes };

      text.length
        ? prev.data.push(text, curr.data)
        : prev.data.push(curr.data);

      break;
  }
};

const parseClosedTag = (tree, item) => {
  const { tagName, text } = item;

  const curr = tree.getCurr();
  const prev = tree.getPrev();
  const currDataType = Type(curr.data);

  if (tagName !== curr.tagName) {
    throw new Error(`Unexpected tag "${tagName}". Expecting closing tag </${curr.tagName}>`);
  }

  switch (currDataType) {
    case 'object':
      if (text.length) {
        if (curr.hasTags) {

          curr.data = convertDataToArray(curr.data).concat(text);
          prev.data[curr.tagName] = curr.data;

        } else if (curr.attributes.attrsLength) {

          curr.data.text = text;

        } else {

          if (Array.isArray(prev.data)) {

            prev.data[prev.data.length - 1].text = text;

          } else if (Array.isArray(prev.data[tagName])) {

            const array = prev.data[tagName];
            array[array.length - 1] = text;
            curr.data = text;

          } else {

            curr.data = text;
            prev.data[curr.tagName] = text;

          }

        }
      }
      break;

    case 'array':
      if (text.length) {
        curr.data.push(text);
      }
      break;
  }

  tree.close(item);
};

const Parsers = [
  parseSingleTag,
  parseOpenedTag,
  parseClosedTag,
];

Parsers.parseSingleTag = parseSingleTag;
Parsers.parseOpenedTag = parseOpenedTag;
Parsers.parseClosedTag = parseClosedTag;

module.exports = Object.freeze(Parsers);
