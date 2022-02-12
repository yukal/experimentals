'use strict';

const BasicModel = require('../BasicModel');

const Unions = require('../unions');
const { STRUCT_HMAP, STRUCT_LIST, STRUCT_MAP, STRUCT_SET } = Unions.constants;

class MediaModel extends BasicModel {
  // primaryKey = 'media_id';
  // tableRelatives = [];

  tableFields = new Set([
    'media_id',
    'media_name',
  ]);

  // ...
}

module.exports = MediaModel;
