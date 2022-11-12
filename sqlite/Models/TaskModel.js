'use strict';

const BasicModel = require('../BasicModel');

class TaskModel extends BasicModel {
  updateStartAt(id, startAt) {
    const data = [startAt, id];
    const sql = `UPDATE "${this.tableName}" SET "start_at" = ? WHERE "region_id" = ?`;

    return new Promise((resolve, reject) => {
      this.connection.run(sql, data, function (error) {
        error !== null ? reject(error) : resolve(this.changes);
      });
    });
  }

  updateTimeout(id, timeout) {
    const data = [timeout, id];
    const sql = `UPDATE "${this.tableName}" SET "timeout" = ? WHERE "region_id" = ?`;

    return new Promise((resolve, reject) => {
      this.connection.run(sql, data, function (error) {
        error !== null ? reject(error) : resolve(this.changes);
      });
    });
  }

  selectAll() {
    const sql = `
    SELECT
      R.region_id as regionId,
      T.timeout as updateTimeout,
      T.start_at as startAt
    FROM "${this.tableName}" T
    LEFT JOIN regions R ON R.region_id = T.region_id;
    `;

    return new Promise((resolve, reject) => {
      this.connection.all(sql, (error, rows) => {
        error !== null ? reject(error) : resolve(rows);
      });
    });
  }
}

module.exports = TaskModel;
