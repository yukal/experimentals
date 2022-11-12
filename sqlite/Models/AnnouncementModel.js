'use strict';

const BasicModel = require('../BasicModel');
const PhoneModel = require('./PhoneModel');
const MediaModel = require('./MediaModel');
const AnnounceMediaModel = require('./AnnounceMediaModel');
const AnnouncePhoneModel = require('./AnnouncePhoneModel');

const Unions = require('../unions');
const { STRUCT_HMAP, STRUCT_LIST, STRUCT_MAP, STRUCT_SET } = Unions.constants;

class AnnouncementModel extends BasicModel {
  primaryKey = 'announce_id';
  tableRelatives = ['phones', 'medias'];
  tableFields = new Set([
    'announce_id',
    'region_id',
    'title',
    'description',
    'link',
    'created_at'
  ]);

  async selectUnionRelatives(announce, structType) {
    const unionQueries = [];
    let unionVariables = [];
    let unionSql = '';

    if (announce.images.length) {
      const params = announce.images.map(() => '?').join(',');
      const query = `SELECT
        "media" AS "type",
        M.media_id AS "id",
        M.media_name AS "value"
      FROM "${MediaModel.prototype.tableName}" AS M
      WHERE M.media_name IN (${params})`;

      unionQueries.push(query);
      unionVariables = unionVariables.concat(announce.images);
    }

    if (announce.phones.length) {
      const params = announce.phones.map(() => '?').join(',');
      const query = `SELECT
        "phone" AS "type",
        P.phone_id AS "id",
        P.phone_number AS "value"
      FROM "${PhoneModel.prototype.tableName}" AS P
      WHERE P.phone_number IN (${params})`;

      unionQueries.push(query);
      unionVariables = unionVariables.concat(announce.phones);
    }

    if (unionQueries.length > 0) {
      unionSql = unionQueries.join(' UNION ');
    }

    const expectingItems = ['media', 'phone'];
    let rows = [];

    if (unionSql.length && unionVariables.length) {
      rows = await new Promise((resolve, reject) => {
        this.connection.all(unionSql, unionVariables, (error, rows) => {
          error !== null ? reject(error) : resolve(rows);
        });
      });
    }

    return Unions.getUnions(rows, expectingItems, structType);
  }

  async insertWithRelatives(announce) {
    const existedAnnounce = await this.doesExist(announce.announce_id);

    if (existedAnnounce) {
      throw new Error(`${this.tableAliasName} already exists`);
    }

    const existedRelatives = await this.selectUnionRelatives(announce, STRUCT_MAP);
    const relatives = identifyRelatives(existedRelatives, announce);

    // Insert General Data

    let success = await this.insertOneByPk(announce);

    if (!success) {
      throw new Error('Insert Error');
    }

    let inserts = 1;
    let uniquePhones = 0;
    let uniqueMedias = 0;

    // Insert Relative Data

    if (relatives.toAdd.phones.length) {
      const phoneModel = new PhoneModel(this.connection);
      const phoneFields = ['phone_number'];

      const IDs = await phoneModel.insertRowsRecursively(phoneFields, relatives.toAdd.phones);
      uniquePhones = IDs.length;

      if (uniquePhones > 0) {
        relatives.existed.phones = relatives.existed.phones.concat(IDs);
        inserts += uniquePhones;
      }
    }

    if (relatives.toAdd.medias.length) {
      const mediaModel = new MediaModel(this.connection);
      const mediaFields = ['media_name'];

      const IDs = await mediaModel.insertRowsRecursively(mediaFields, relatives.toAdd.medias);
      uniqueMedias = IDs.length;

      if (uniqueMedias > 0) {
        relatives.existed.medias = relatives.existed.medias.concat(IDs);
        inserts += uniqueMedias;
      }
    }

    // Bind Relative Data

    if (relatives.existed.phones.length) {
      const junction = new AnnouncePhoneModel(this.connection);
      const relativesToInsert = {
        owner: { column: 'announce_id', value: announce.announce_id },
        child: { column: 'phone_id', value: relatives.existed.phones }
      };

      const addedRows = await junction.insertBondedRelatives(relativesToInsert);
      success = success && addedRows > 0;
      inserts += addedRows;
    }

    if (relatives.existed.medias.length) {
      const junction = new AnnounceMediaModel(this.connection);
      const relativesToInsert = {
        owner: { column: 'announce_id', value: announce.announce_id },
        child: { column: 'media_id', value: relatives.existed.medias }
      };

      const addedRows = await junction.insertBondedRelatives(relativesToInsert);
      success = success && addedRows > 0;
      inserts += addedRows;
    }

    return { inserts, uniquePhones, uniqueMedias };
  }
}

const identifyRelatives = (existedRelatives, newData) => {
  const existed = { phones: [], medias: [] };
  const toAdd = { phones: [], medias: [] };

  const existedMedia = existedRelatives.get('media');
  const existedPhone = existedRelatives.get('phone');

  for (const image of newData.images) {
    if (existedMedia.has(image)) {
      existed.medias.push(existedMedia.get(image));
    } else {
      toAdd.medias.push(image);
    }
  }

  for (const phone of newData.phones) {
    if (existedPhone.has(phone)) {
      existed.phones.push(existedPhone.get(phone));
    } else {
      toAdd.phones.push(phone);
    }
  }

  return { existed, toAdd };
};

module.exports = AnnouncementModel;
