'use strict';

class BasicModel {
  tableFields = new Set([]);

  constructor(connection) {
    Reflect.defineProperty(this, 'connection', {
      get: () => connection,
    });
  }

  get tableName() {
    // const name = this.constructor.name.slice(0, -5);
    let name = this.constructor.name.replace(/Model$/i, '');
    name = name[0].toLowerCase() + name.slice(1);
    name = name.replace(/[A-Z]{1}/g, s => `_${s.toLowerCase()}`);

    return `${name}s`.toLowerCase();
  }

  get tableAliasName() {
    // return this.constructor.name.slice(0, -5);
    return this.constructor.name.replace(/Model$/i, '');
  }

  get modelName() {
    return this.constructor.name;
  }

  get primaryKey() {
    // const name = this.constructor.name.slice(0, -5);
    const name = this.constructor.name.replace(/Model$/i, '');
    return `${name}_id`.toLowerCase();
  }

  async doesExist(id) {
    const row = await this.selectOne(id, [this.primaryKey]);
    return row == undefined ? false : row[this.primaryKey] == id;
  }

  selectOne(id, fields) {
    const { tableName, primaryKey } = this;

    const selectedFields = fields.join('","');
    const sql = `SELECT "${selectedFields}" FROM "${tableName}" WHERE "${primaryKey}" = ? LIMIT 1`;

    return new Promise(async (resolve, reject) => {
      this.connection.get(sql, [id], (error, row) => {
        error !== null ? reject(error) : resolve(row);
      });
    });
  }

  insertOne(data) {
    const { primaryKey, tableName, tableFields } = this;
    const { [primaryKey]: pk, ...dataToInsert } = data;

    const fieldsToInsert = [];
    const valuesToInsert = [];

    for (const fieldName in dataToInsert) {
      if (tableFields.has(fieldName)) {
        fieldsToInsert.push(fieldName);
        valuesToInsert.push(dataToInsert[fieldName]);
      }
    }

    const fields = fieldsToInsert.join('","');
    const params = [...valuesToInsert];
    valuesToInsert.fill('?');

    const sql = `INSERT INTO ${tableName} ("${fields}") VALUES(${valuesToInsert})`;

    return new Promise((resolve, reject) => {
      this.connection.run(sql, params, function (error) {
        error !== null ? reject(error) : resolve(this.lastID);
      });
    });
  }

  /**
   * Insert record implicitly into a specific place using a primary key
   *
   * @param {object} data 
   * @returns Promise<number> last insert id
   */
  insertOneByPk(data) {
    const { tableName, tableFields } = this;

    const fieldsToInsert = [];
    const valuesToInsert = [];

    for (const fieldName in data) {
      if (tableFields.has(fieldName)) {
        fieldsToInsert.push(fieldName);
        valuesToInsert.push(data[fieldName]);
      }
    }

    const fields = fieldsToInsert.join('","');
    const values = [...valuesToInsert];
    valuesToInsert.fill('?');

    const sql = `INSERT INTO "${tableName}" ("${fields}") VALUES(${valuesToInsert})`;

    return new Promise((resolve, reject) => {
      this.connection.run(sql, values, function (error) {
        error !== null ? reject(error) : resolve(this.changes == 1);
      });
    });
  }

  insertRowsRecursively(fields = [], values = []) {
    const { tableName, tableFields } = this;

    const fieldsToInsert = [];
    // const valuesToInsert = [];

    for (const fieldName of fields) {
      if (tableFields.has(fieldName)) {
        fieldsToInsert.push(fieldName);
        // valuesToInsert.push(data[fieldName]);
      }
    }

    const paramsToInsert = '?,'.repeat(fieldsToInsert.length).slice(0, -1);
    const separatedFields = fieldsToInsert.join('","');

    const sql = `INSERT INTO "${tableName}" ("${separatedFields}") VALUES (${paramsToInsert})`;

    return new Promise((resolve, reject) => {
      const params = { sql, values, IDs: [], n: 0 };

      insertRowsBatch(this, params, (error, IDs) => {
        error !== null ? reject(error) : resolve(IDs);
      });
    });
  }

  insertRowsNatively(fields = [], values = []) {
    const { tableName, tableFields } = this;

    return new Promise((resolve, reject) => {
      const fieldsToInsert = [];

      for (const fieldName of fields) {
        if (tableFields.has(fieldName)) {
          fieldsToInsert.push(fieldName);
        }
      }

      const paramsToInsert = '?,'.repeat(fieldsToInsert.length).slice(0, -1);
      const separatedValues = `(${paramsToInsert}),`.repeat(values.length).slice(0, -1);
      const separatedFields = fieldsToInsert.join('","');

      const sql = `INSERT INTO "${tableName}" ("${separatedFields}") VALUES ${separatedValues}`;

      this.connection.run(sql, values, function (error) {
        if (error !== null) {
          reject(error);
          return;
        }

        // get the last insert id
        // console.log(`A row has been inserted with rowid ${this.lastID}`);

        resolve(this);
      });
    });
  }

  // Insert bonded relatives
  insertBondedRelatives(options) {
    const { tableName, tableFields } = this;

    const { owner, child } = options;

    const fields = `("${owner.column}","${child.column}")`;
    const valuesMask = `,(?,?)`.repeat(child.value.length).slice(1);
    const values = [];

    for (const value of child.value) {
      values.push(owner.value);
      values.push(value);
    }

    const sql = `INSERT INTO "${tableName}" ${fields} VALUES ${valuesMask}`

    return new Promise((resolve, reject) => {
      this.connection.run(sql, values, function (error) {
        error !== null ? reject(error) : resolve(this.changes);
      });
    });
  }
}

const insertRowsBatch = (ctx, params, callback) => {
  const { sql, values, IDs, n } = params;

  if (n < values.length) {
    const value = values[n];

    ctx.connection.run(sql, value, function (error) {
      if (error !== null) {
        console.log(error);
        // console.log('DUMP:', sql, value);

        // callback(error, null);
        // return;
      }

      if (this.changes > 0) {
        IDs.push(this.lastID);
      }

      params.n++;
      insertRowsBatch(ctx, params, callback);
    });
  } else {
    callback(null, IDs);
  }
};

module.exports = BasicModel;
