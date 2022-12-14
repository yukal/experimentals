'use strict';

const Crypto = require('crypto');
const Fs = require('fs');
const Path = require('path');

const DB_FILE_EXT = 'sql';

const {
  O_CREAT, O_APPEND,
  S_IRUSR, S_IWUSR, S_IXUSR,
  S_IRGRP, S_IWGRP, S_IXGRP,
  S_IROTH, S_IWOTH, S_IXOTH
} = Fs.constants;

const toCamelCase = (text) => {
  return `-${text}`.toLowerCase()
    .replace(/\W+(\w)/g, (match, firstLetter) => firstLetter.toUpperCase());
}

class Migration {
  constructor(db, settings) {
    // Define hidden readonly data
    Reflect.defineProperty(this, 'db', { value: db });
    Reflect.defineProperty(this, 'settings', {
      value: settings.migration
    });
  }

  static generateId(description, type) {
    const canonicalDate = new Date().toISOString().replace(/\D/g, '');
    const randomBytesHex = Crypto.randomBytes(3).toString('hex');
    const hasDescription = description != undefined && description.length > 0;

    const migrationType = type ? type.toLowerCase() : '';

    return hasDescription
      ? migrationType + canonicalDate + randomBytesHex + '-' + toCamelCase(description)
      : migrationType + canonicalDate + randomBytesHex;
  }

  /**
   * Creates emty file with name based on migration type and description.
   * For example:
   *  up20221120152124307a37da4.sql
   *  dn2022112015212441031eb16.sql
   *
   * @param {string} type Migration type [up | down]
   * @param {string} description Migration description
   * @returns object
   */
  async createRecord(type, description) {
    const fileName = Migration.generateId(description, type);
    const fileBaseName = `${fileName}.${DB_FILE_EXT}`;
    const filePath = Path.join(this.settings.path, fileBaseName);
    const fileMode = S_IRUSR | S_IWUSR | S_IRGRP;
    const fileFlag = O_CREAT;

    const file = await Fs.promises.open(filePath, fileFlag, fileMode);
    const stat = await file.stat();

    await file.close();

    return {
      base: fileBaseName,
      name: fileName,
      ext: DB_FILE_EXT,
      path: filePath,

      // hash,
      stat,
    };
  }

  /**
   * createRecordWithFileDate
   * @param {string} type Migration type [up | down]
   * @param {string} description Migration description [optional]
   * @returns object
   */
  async createRecordWithFileDate(type, description = '') {
    const hasDescription = description.length > 0;

    if (hasDescription) {
      description = `-${description}`.toLowerCase()
        .replace(/\W+(\w)/g, (match, firstLetter) => firstLetter.toUpperCase());
    }

    const randomBytes = Crypto.randomBytes(16).toString('hex');

    const tmpFilePath = Path.join(this.settings.path, `${randomBytes}.tmp`);
    const fileMode = S_IRUSR | S_IWUSR | S_IRGRP;
    const fileFlag = O_CREAT;

    const file = await Fs.promises.open(tmpFilePath, fileFlag, fileMode);
    const stat = await file.stat();

    const hash = randomBytes.slice(-6);

    // const fileISOTime = stat.birthtime.toISOString();
    const fileTime = stat.birthtime.toISOString().replace(/\D/g, '');
    const fileName = hasDescription
      ? type + fileTime + hash + '-' + description
      : type + fileTime + hash;

    const fileBaseName = `${fileName}.${DB_FILE_EXT}`;
    const newFilePath = Path.join(this.settings.path, fileBaseName);

    await file.close();
    await Fs.promises.rename(tmpFilePath, newFilePath);

    return {
      base: fileBaseName,
      name: fileName,
      ext: DB_FILE_EXT,
      path: newFilePath,

      // hash,
      stat,
    };
  }

  // async up(migrationRule) {
  //   return this.startMigration('up', migrationRule);
  // }

  // async down(migrationRule) {
  //   return this.startMigration('dn', migrationRule);
  // }

  async getMigrationList(migrationType) {
    const directoryEntities = await Fs.promises.readdir(this.settings.path);
    const extension = `.${DB_FILE_EXT}`;
    const sqlFiles = [];

    if (migrationType === 'down') {
      migrationType = 'dn';
    }

    for (const entity of directoryEntities) {
      const matchedFile = migrationType
        ? entity.endsWith(extension) && entity.startsWith(migrationType)
        : entity.endsWith(extension)

      if (matchedFile) {
        sqlFiles.push(entity);
      }
    }

    return sqlFiles;
  }

  async startMigration(migrationType, migrationRule) {
    const { path: migrationPath } = this.settings;

    const directoryEntities = await Fs.promises.readdir(migrationPath);
    const sqlFileExt = `.${DB_FILE_EXT}`;
    let sqlFiles = [];

    // if (!MigrationTypes.has(migrationType)) {
    //   throw new Error('Unknown Migration Type');
    // }

    for (const entity of directoryEntities) {
      if (entity.startsWith(migrationType) && entity.endsWith(sqlFileExt)) {
        sqlFiles.push(entity);
      }
    }

    switch (typeof migrationRule) {
      case 'number':
        const index = migrationRule - 1;

        if (!Reflect.has(sqlFiles, index)) {
          const errorMessage = `There is no item with index [${migrationRule}]`;
          throw new Error(errorMessage);
        }

        sqlFiles = [sqlFiles[index]];

        // sqlFiles = Reflect.has(sqlFiles, index)
        //   ? [sqlFiles[index]] : [];

        break;

      case 'string':
        sqlFiles = getMatchedMigrationItems(migrationRule, sqlFiles);
        break;
    }

    // console.log(sqlFiles);
    // return Promise.resolve(sqlFiles);

    return new Promise((resolve, reject) => {
      const options = {
        db: this.db,
        migrationPath,
        sqlFiles,
      };

      processMigrationRecursively(options, (error) => {
        error instanceof Error ? reject(error) : resolve();
      });

      // this.db.serialize(() => processMigrationRecursively(options, (error) => {
      //   error instanceof Error ? reject(error) : resolve();
      // }));
    });
  }
}

const filterMigrationBySteps = (rule, items) => {
  let [from, to] = rule.split('-');

  from = Number.parseInt(from, 10) - 1;
  to = Number.parseInt(to, 10);

  if (from < 0) {
    from = 0;
  }

  if (to <= from) {
    to = from + 1;
  }

  return items.slice(from, to);
};

const filterMigrationByGroup = (rule, items) => {
  const matchedItems = [];
  const indeces = rule.endsWith(',')
    ? rule.slice(0, -1).split(',')
    : rule.split(',');

  for (const number of indeces) {
    const index = number - 1;

    if (!Reflect.has(items, index)) {
      const errorMessage = `There is no item with index [${number}]. Rule(${rule})`;
      throw new Error(errorMessage);
    }

    matchedItems.push(items[index]);
  }

  return matchedItems;
};

const getMatchedMigrationItems = (migrationRule, items) => {
  const migrationRules = migrationRule.split(';');
  let migrationItems = [];

  for (const rule of migrationRules) {
    if (!rule.length) {
      continue;
    }

    const match = /^(?<steps>(?:\d-\d){1})|^(?<group>[\d,]+)/.exec(rule);

    if (match === null) {
      continue;
    }

    const { steps, group } = match.groups;

    if (steps !== undefined) {
      migrationItems = migrationItems.concat(
        filterMigrationBySteps(steps, items)
      );

      continue;
    }

    if (group !== undefined) {
      migrationItems = migrationItems.concat(
        filterMigrationByGroup(group, items)
      );

      continue;
    }
  }

  return migrationItems;
};

const processMigrationRecursively = async (options, callback) => {
  const { db, migrationPath, sqlFiles } = options;

  if (sqlFiles.length) {

    const fileName = sqlFiles.shift();
    const filePath = Path.join(migrationPath, fileName);

    const sql = await Fs.promises.readFile(filePath, { encoding: 'utf8' });

    if (sql.length > 0) {
      db.serialize(() => {
        db.run(sql, (error) => {

          if (error !== null) {
            // console.log(error);
            console.log(fileName);
            console.error(error.message);
          }

        });
      });
    }

    setTimeout(processMigrationRecursively, 0, options, callback);

  } else if (callback instanceof Function) {

    callback();

  }
};

module.exports = Migration;
