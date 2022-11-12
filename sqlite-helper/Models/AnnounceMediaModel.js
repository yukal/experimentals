'use strict';

const BasicModel = require('../BasicModel');

const Unions = require('../unions');
const { STRUCT_HMAP, STRUCT_LIST, STRUCT_MAP, STRUCT_SET } = Unions.constants;

class AnnounceMediaModel extends BasicModel {
  primaryKey = 'id';
  tableFields = new Set([
    'id',
    'announce_id',
    'media_id',
  ]);

  // ...
}

module.exports = AnnounceMediaModel;
