'use strict';

class BasicModel {
  tableFields = new Set([]);

  constructor(connection) {
    if (connection != undefined) {
      this.connection = connection;
    }
  }

  /**
   * Get table name from a constructor name of the model
   * and represent it in a lower snake case format (SomeModel => some_model)
   */
  get tableName() {
    let name = this.constructor.name.replace(/Model$/i, '');
    name = name[0].toLowerCase() + name.slice(1);
    name = name.replace(/[A-Z]{1}/g, s => `_${s.toLowerCase()}`);

    return `${name}`.toLowerCase();
  }

  get tableAliasName() {
    return this.constructor.name.replace(/Model$/i, '');
  }

  get modelName() {
    return this.constructor.name;
  }

  get primaryKey() {
    const name = this.constructor.name.replace(/Model$/i, '');
    return `${name}_id`.toLowerCase();
  }

  /**
   * Check does the record exists in the Database
   * @param {Number} id Id of the record
   * @returns boolean
   */
  async doesExist(id) {
    const row = await this.selectOne(id, [this.primaryKey]);
    return row == undefined ? false : row[this.primaryKey] == id;
  }

  /**
   * Select record by a specific ID in the Database
   * @param {Number} id ID of the record
   * @param {Array} fields A list of fields in table
   * @returns object
   */
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

  /**
   * Insert data to a Database and return the last inserted ID
   * @param {Object} data 
   * @returns number Last inserted ID
   */
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

    const sql = `INSERT INTO "${tableName}" ("${fields}") VALUES(${valuesToInsert})`;

    return new Promise((resolve, reject) => {
      this.connection.run(sql, params, function (error) {
        error !== null ? reject(error) : resolve(this.lastID);
      });
    });
  }

  /**
   * Explicitly insert data into a specific place by a primary key
   * @param {Object} data 
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

  /**
   * Inserts data step by step and receives each last inserted ID of the record
   * @param {Array} fields The fields of a specific table
   * @param {Array} values Values to be inserted into DataBase
   * @returns Promise<IDs> ID list of the inserted records
   */
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

    return new Promise((resolve) => {
      const params = { sql, values, errors: [], IDs: [], n: 0 };
      recursivelyInsertRows(this, params, (errors, IDs) => resolve(errors, IDs));
    });
  }

  /**
   * Insert rows per one request. It does not return the IDs list of the inserted rows
   * @param {Array} fields The fields of a specific table
   * @param {Array} values Values to be inserted into DataBase
   * @returns Number The number of last insrted rows
   */
  insertRowsNatively(fields = [], values = []) {
    const { tableName, tableFields } = this;

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

    return new Promise((resolve, reject) => {
      this.connection.run(sql, values, function (error) {
        error !== null ? reject(error) : resolve(this.changes);
      });
    });
  }

  /**
   * Insert bonded relatives (useful for tables with junctions having a one to many or a many to many relations)
   * @param {Object} options 
   * @returns Number The number of last insrted rows
   */
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

const recursivelyInsertRows = (ctx, params, callback) => {
  const { sql, values, errors, IDs, n } = params;

  if (n < values.length) {
    const value = values[n];

    ctx.connection.run(sql, value, function (error) {
      if (error !== null) {
        errors.push(error);
      }

      if (this.changes > 0) {
        IDs.push(this.lastID);
      }

      params.n++;
      recursivelyInsertRows(ctx, params, callback);
    });
  } else {
    callback(errors, IDs);
  }
};

module.exports = BasicModel;
