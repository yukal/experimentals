'use strict';

const BasicModel = require('../BasicModel');

const Unions = require('../unions');
const { STRUCT_HMAP, STRUCT_LIST, STRUCT_MAP, STRUCT_SET } = Unions.constants;

class PhoneModel extends BasicModel {
  // primaryKey = 'phone_id';
  // tableRelatives = [];

  tableFields = new Set([
    'phone_id',
    'phone_number',
  ]);

  // ...
}

module.exports = PhoneModel;
