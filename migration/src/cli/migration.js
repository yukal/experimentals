#!/usr/bin/env node

'use strict';

const { application: settings } = require('../../package.json');
const {
  Migration,
  SqliteDatabaseAsync
} = require('../sqlite');

const Cli = require('./migration.helper');

const Main = async () => {
  const args = process.argv.slice(2);
  const [command, ...params] = args;

  if (!args.length) {
    await Cli.terminateWithUsage();
  }

  try {

    // const db = SqliteDatabaseAsync.create(settings.database);
    const db = await SqliteDatabaseAsync.from(settings.database);
    const migration = new Migration(db, settings.database);

    const cli = Cli.from(migration);
    await cli.run(command, params);

    await db.closeAsync();

  } catch(error) {

    console.log(error);
    process.exit(-1);

  }

  // Cli.terminate(0);
  process.exit(0);
};

Main();
