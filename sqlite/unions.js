'use strict';

const STRUCT_LIST = 'List';
const STRUCT_HMAP = 'HashMap';
const STRUCT_SET = 'Set';
const STRUCT_MAP = 'Map';

const getUnions = (rows, expectingItems, structType) => {
  let unions;

  switch (structType) {
    case STRUCT_LIST:
      unions = getUnionList(rows, expectingItems);
      break;

    case STRUCT_SET:
      unions = getUnionSet(rows, expectingItems);
      break;

    case STRUCT_HMAP:
      unions = getUnionHashmap(rows, expectingItems);
      break;

    case STRUCT_MAP:
      unions = getUnionMap(rows, expectingItems);
      break;

    default:
      unions = getUnionList(rows, expectingItems);
      break;
  }

  return unions;
};

const getUnionList = (rows, expectingItems) => {
  const unions = {};

  for (const item of rows) {
    const { type, ...values } = item;

    if (!unions.hasOwnProperty(item.type)) {
      unions[item.type] = [values];
    } else {
      unions[item.type].push(values);
    }
  }

  for (const item of expectingItems) {
    if (!unions.hasOwnProperty(item)) {
      unions[item] = [];
    }
  }

  return unions;
};

const getUnionHashmap = (rows, expectingItems) => {
  const unions = {};

  for (const item of rows) {
    const { type, ...values } = item;

    if (!unions.hasOwnProperty(item.type)) {
      unions[item.type] = { [values.value]: values.id };
    } else {
      const itemEntry = unions[item.type];
      itemEntry[values.value] = values.id;
    }
  }

  for (const item of expectingItems) {
    if (!unions.hasOwnProperty(item)) {
      unions[item] = {};
    }
  }

  return unions;
};

const getUnionSet = (rows, expectingItems) => {
  const unions = {};

  for (const item of rows) {
    const { type, ...values } = item;

    if (!unions.hasOwnProperty(item.type)) {
      unions[item.type] = new Set([values]);
    } else {
      unions[item.type].add(values);
    }
  }

  for (const item of expectingItems) {
    if (!unions.hasOwnProperty(item)) {
      unions[item] = new Set();
    }
  }

  return unions;
};

const getUnionMap = (rows, expectingItems) => {
  const unions = new Map();

  for (const item of rows) {
    const { type, ...values } = item;

    if (!unions.has(item.type)) {
      const map = new Map([[values.value, values.id]]);
      unions.set(item.type, map);
    } else {
      unions.get(item.type).set(values.value, values.id);
    }
  }

  for (const item of expectingItems) {
    if (!unions.has(item)) {
      unions.set(item, new Map());
    }
  }

  return unions;
};

module.exports = {
  constants: {
    STRUCT_LIST,
    STRUCT_HMAP,
    STRUCT_SET,
    STRUCT_MAP,
  },

  getUnions,
  getUnionList,
  getUnionHashmap,
  getUnionSet,
  getUnionMap,
};
