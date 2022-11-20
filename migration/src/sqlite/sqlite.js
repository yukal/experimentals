'use strict';

const Sqlite = require('sqlite3').verbose();

class SqliteDatabaseAsync extends Sqlite.Database {
  constructor(settings, callback) {
    super(settings.filePath, callback);

    Reflect.defineProperty(this, 'settings', {
      get: () => settings,
    })
  }

  static create(settings, connectionMask = Sqlite.OPEN_READWRITE | Sqlite.OPEN_CREATE) {
    return new SqliteDatabaseAsync(settings, connectionMask);
  }

  static from(settings, connectionMask = Sqlite.OPEN_READWRITE | Sqlite.OPEN_CREATE) {
    return new Promise((resolve, reject) => {
      const connection = new SqliteDatabaseAsync(settings, (error) => {
        error !== null ? reject(error) : resolve(connection);
      });
    });
  }

  allAsync(sql) {
    return new Promise((resolve, reject) => {
      this.all(sql, (error, rows) => error instanceof Error ? reject(error) : resolve(rows));
    });
  }

  closeAsync() {
    return new Promise((resolve, reject) => {
      this.close((error) => error instanceof Error ? reject(error) : resolve(true));
    });
  }

  eachAsync(sql, onItemCallback) {
    const items = [];

    return new Promise((resolve, reject) => {
      this.each(sql, (error, row) => {

        if (onItemCallback instanceof Function) {
          onItemCallback(error, row);
        }

        items.push({ error, row });

      }, (error, count) => {

        error instanceof Error ? reject(error) : resolve({ items, count });

      });
    });
  }

  execAsync(sql) {
    return new Promise((resolve, reject) => {
      this.exec(sql, (error) => error instanceof Error ? reject(error) : resolve(true))
    });
  }

  getAsync(sql) {
    return new Promise((resolve, reject) => {
      this.get(sql, (error, row) => error instanceof Error ? reject(error) : resolve(row))
    });
  }

  prepareAsync(sql) {
    return new Promise((resolve, reject) => {
      this.prepare(sql, (error) => error instanceof Error ? reject(error) : resolve(true))
    });
  }

  runAsync(sql) {
    return new Promise((resolve, reject) => {
      this.run(sql, (error) => error instanceof Error ? reject(error) : resolve(true))
    });
  }
}

module.exports = SqliteDatabaseAsync;
