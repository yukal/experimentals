'use strict';

const BasicModel = require('../BasicModel');

const AnnouncementModel = require('./AnnouncementModel');
const MediaModel = require('./MediaModel');
const PhoneModel = require('./PhoneModel');
const TaskModel = require('./TaskModel');

module.exports = new Map([
  ['Basic', BasicModel],

  ['Announcement', AnnouncementModel],
  ['Media', MediaModel],
  ['Phone', PhoneModel],
  ['Task', TaskModel],
]);
