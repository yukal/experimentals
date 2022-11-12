'use strict';

const Path = require('path');
const Fs = require('fs');
const XML = require('./src');

const Main = async () => {
  const filePath = Path.join(process.cwd(), './data/schema.xsd');
  const documentText = await Fs.promises.readFile(filePath, { encoding: 'utf8' });

  const options = {
    // openTagAttrPrefix: '',
  };

  const hrstart = process.hrtime();
  const tree = XML.parse(documentText, options);
  const hrend = process.hrtime(hrstart);

  console.log(tree);
  console.info('Execution time: %ds %dms', hrend[0], hrend[1] / 1000000);
};

Main();
