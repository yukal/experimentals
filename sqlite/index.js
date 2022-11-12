'use strict';

const Sqlite = require('sqlite3').verbose();
const { map: DatabaseModels } = require('./Models');

const fromDatabaseFile = ({ filename }) => ({
  getConnection: async () => {
    const connection = await new Promise((resolve, reject) => {
      const _connection = new Sqlite.Database(filename, Sqlite.OPEN_READWRITE, (error) => {
        error !== null ? reject(error) : resolve(_connection);
      });
    });

    for (const [databaseName, DatabaseModel] of DatabaseModels) {
      if (Reflect.has(connection, databaseName)) {
        throw new Error(`connection has ${databaseName} entry already`);
      }

      connection[databaseName] = new DatabaseModel(connection);
    }

    return connection;
  }
});

module.exports = {
  from: fromDatabaseFile
};
