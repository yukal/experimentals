'use strict';

const Path = require('path');
const Fs = require('fs');

const Cli = {};

Cli.from = (migration) => {
  const actions = {
    cliUp: async (rule) => {
      await migration.startMigration('up', rule);
    },

    cliDn: async (rule) => {
      await migration.startMigration('dn', rule);
    },

    cliLs: async (type) => {
      const migrationList = await migration.getMigrationList(type);
      return migrationList.length > 0
        ? migrationList.join('\n')
        : undefined;
    },

    cliGen: async (entity, ...params) => {
      const [migrationDescription] = params;

      switch (entity) {
        case 'id':
          return migration.generateId(migrationDescription);
          break;

        case 'up':
          const upResult = await migration.createRecord('up', migrationDescription);
          return `Created file: ${upResult.base}`;
          break;

        case 'dn':
        case 'down':
          const dnResult = await migration.createRecord('dn', migrationDescription);
          return `Created file: ${dnResult.base}`;
          break;

        default:
          return Cli.terminateWithUsage();
          break;
      }
    },

    cliUnknown: async () => Cli.terminateWithUsage(1),
  };

  // Aliases
  Object.defineProperties(actions, {
    cliDown: { value: actions.cliDn },
    cliList: { value: actions.cliLs },
  });

  const Api = {
    getCliActionName: (command) => {
      return 'cli' + command[0].toUpperCase() + command.slice(1).toLowerCase();
    },

    hasAction: (command) => {
      const actionName = Api.getCliActionName(command);
      return Reflect.has(actions, actionName);
    },

    getAction: (command) => {
      const actionName = Api.getCliActionName(command);
      return Reflect.has(actions, actionName)
        ? actions[actionName]
        : actions.cliUnknown;
    },

    run: async (command, params, opts) => {
      const migrationAction = Api.getAction(command);
      const message = await migrationAction(...params);

      if (typeof message === 'string') {
        process.stdout.write(`${message}\n`);
      }

      // else if (typeof message == 'object' && message != null) {
      //   console.log(message);
      // }

      // typeof message === 'string'
      //   ? process.stdout.write(`${message}\n`)
      //   : console.log(message);

      return true;
    },
  };

  return Object.freeze(Api);
};

Cli.terminate = (code = 0, text = '') => {
  if (text.length > 0) {
    process.stderr.write(text + '\n');
  }

  process.exit(code);
};

Cli.getUsageInfo = async () => {
  if (!Reflect.has(Cli, '_usageInfo')) {
    const pathMigrationUsage = Path.join(process.cwd(), './migration.md');
    const usageInfo = await Fs.promises.readFile(pathMigrationUsage, {
      encoding: 'utf8'
    });

    Reflect.defineProperty(Cli, '_usageInfo', {
      value: usageInfo
    });

    return Reflect.get(Cli, '_usageInfo');
  }
};

Cli.terminateWithUsage = async (code = 0) => {
  const usageInfo = await Cli.getUsageInfo();
  Cli.terminate(code, usageInfo);
};

module.exports = Cli;
