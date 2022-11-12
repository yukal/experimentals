'use strict';

const sqlite = require('sqlite3');
const DatabaseModelsMap = require('./Models');

class SqliteDatabase {
  connection;
  filename;

  static from(databaseFile) {
    return new SqliteDatabase(databaseFile);
  }

  constructor(databaseFile) {
    this.filename = databaseFile;

    return new Proxy(this, {
      get(self, name, receiver) {
        if (DatabaseModelsMap.has(name)) {
          const DatabaseModel = DatabaseModelsMap.get(name);

          Reflect.defineProperty(self, name, {
            value: new DatabaseModel(self.connection),
            enumerable: true,
          });
        }

        return Reflect.has(self, name)
          ? Reflect.get(self, name, receiver)
          : undefined;
      },
    });
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      const connection = new sqlite.Database(this.filename, sqlite.OPEN_READWRITE, (error) => {
        error !== null ? reject(error) : resolve(this.connection = connection);
      });
    });
  }

  closeConnection() {
    return new Promise((resolve, reject) => {
      this.connection.close((error) => {
        error !== null ? reject(error) : resolve(true);
      });
    });
  }
}

module.exports = SqliteDatabase;
