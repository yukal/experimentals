'use strict';

const BasicModel = require('../BasicModel');

const Unions = require('../unions');
const { STRUCT_HMAP, STRUCT_LIST, STRUCT_MAP, STRUCT_SET } = Unions.constants;

class AnnouncePhoneModel extends BasicModel {
  primaryKey = 'id';
  tableFields = new Set([
    'id',
    'announce_id',
    'phone_id',
  ]);

  // ...
}

module.exports = AnnouncePhoneModel;
