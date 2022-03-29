const express = require('express');
const vagController = require('../controllers/vag');

module.exports = (context) => {
  let router = express.Router();
  router.get('/devices/list', vagController.getSessions.bind(context));
  router.post('/devices/catalog', vagController.getCatalog.bind(context));
  router.post('/devices/realplay', vagController.realplay.bind(context));
  router.post('/devices/ptz', vagController.ptzControl.bind(context));
  router.get('/devices/:device/:channel/playback/:action/:begin/:end/:host/:port/:mode', vagController.playback.bind(context));
  router.get('/devices/:device/:channel/playback/control/:begin/:end/:cmd/:value', vagController.playControl.bind(context));
  router.get('/devices/:device/:channel/record/query/:begin/:end', vagController.recordQuery.bind(context));
  router.post('/ZLMediaKit/on_stream_none_reader',vagController.closeStream.bind(context));
  router.get('/media/snap/:stream', vagController.snap.bind(context));
  router.get('/media/startRecord/:stream', vagController.startRecord.bind(context));
  router.get('/media/stopRecord/:stream', vagController.stopRecord.bind(context));

  // 给zlm回调使用
  router.post('/media/hook/on_stream_none_reader', vagController.zlmNoneReader.bind(context));
  router.post('/media/hook/on_record_mp4', vagController.zlmRecordPath.bind(context));
  router.post('/media/hook/on_publish', vagController.zlmOnPublish.bind(context));
  router.post('/media/hook/on_play', vagController.zlmOnPlay.bind(context));
  return router;
};