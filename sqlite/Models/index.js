const BasicModel = require('../BasicModel');

const AnnounceModel = require('./AnnounceModel');
const MediaModel = require('./MediaModel');
const PhoneModel = require('./PhoneModel');
const TaskModel = require('./TaskModel');

module.exports = ({
  items: [
    BasicModel,
    AnnounceModel,
    MediaModel,
    PhoneModel,
    TaskModel,
  ],

  map: new Map([
    ['BasicModel', BasicModel],
    ['AnnounceModel', AnnounceModel],
    ['MediaModel', MediaModel],
    ['PhoneModel', PhoneModel],
    ['TaskModel', TaskModel],
  ]),

  // map: new Map([
  //   ['Basic', BasicModel],
  //   ['Announcement', AnnounceModel],
  //   ['Media', MediaModel],
  //   ['Phone', PhoneModel],
  //   ['Task', TaskModel],
  // ]),
});
