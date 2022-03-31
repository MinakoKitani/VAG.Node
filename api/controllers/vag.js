const axios = require('../../core/request');
const config = require('../../config');
const util = require('../../core/util');

//获取所有SIP会话
function getSessions(req, res, next) {
    let sessions = {};

    this.sessions.forEach(function (session, id) {
        if (session.TAG === 'sip')
            sessions[session.id] = { host: session.via.host, port: session.via.port, info: session.deviceinfo, status: session.devicestatus, catalog: session.catalog };
    });

    res.json({
        stat: 'OK',
        data: sessions
    });
}

//获取指定设备ID的目录数据
function getCatalog(req, res) {
    let result = { stat: 'error' };
    if (this.sessions.has(req.body.deviceId)) {
        let session = this.sessions.get(req.body.deviceId);

        result.stat = 'OK';
        result.data = session.catalog;
    }
    else {
        result.message = 'device not online.';
    }
    res.json(result);
}

//预览请求
async function realplay(req, res) {

    let result = { stat: 'OK' };

    if (this.sessions.has(req.body.deviceId)) {

        let session = this.sessions.get(req.body.deviceId);

        //判断当前设备通道里是否存在通道编码
        let channelId = req.body.channelId;

        let channel = session.catalog.devicelist.find(t => t.DeviceID === channelId);

        if (channel) {
            switch (req.body.action) {
                case 'start':
                    {
                        result = await session.sendRealPlayMessage(channelId, req.body.mediaHost, req.body.mediaPort, req.body.mode);
                    }
                    break;
                case 'stop':
                    {
                        result = await session.sendStopRealPlayMessage(channelId, req.body.mediaHost, req.body.mediaPort);
                    }
                    break;
                default:
                    {
                        result.stat = 'error';
                        result.message = 'action error.';
                    }
                    break;
            }
        }
        else {
            result.stat = 'error';
            result.message = 'device not found.';
        }
    }
    else {
        result.stat = 'error';
        result.message = 'device not online.';
    }
    res.json(result);
}

//回看请求
async function playback(req, res) {
    let result = { result: true, message: 'OK' };

    if (this.sessions.has(req.params.device)) {
        let session = this.sessions.get(req.params.device);

        //判断当前设备通道里是否存在通道编码
        let channelId = req.params.channel;

        let channel = session.catalog.devicelist.find(t => t.DeviceID === channelId);

        if (channel) {
            switch (req.params.action) {
                case 'start':
                    {
                        result = await session.sendPlaybackMessage(req.params.channel, req.params.begin, req.params.end, req.params.host, req.params.port, req.params.mode);
                    }
                    break;
                case 'stop':
                    {
                        result = await session.sendStopPlayBackMessage(req.params.channel, req.params.begin, req.params.end, req.params.host, req.params.port);
                    }
                    break;
                default:
                    {
                        result.result = false;
                        result.message = 'action error.';
                    }
                    break;
            }
        }
        else {
            result.result = false;
            result.message = 'device not found.';
        }
    }
    else {
        result.result = false;
        result.message = 'device not online';
    }
    res.json(result);
}

//回看播放控制
async function playControl(req, res) {
    let result = {};

    if (this.sessions.has(req.params.device)) {
        let session = this.sessions.get(req.params.device);

        //判断当前设备通道里是否存在通道编码
        let channelId = req.params.channel;

        let channel = session.catalog.devicelist.find(t => t.DeviceID === channelId);

        if (channel) {
            result = await session.sendPlayControlMessage(req.params.channel, req.params.begin, req.params.end, req.params.cmd, req.params.value);
        }
        else {
            result.result = false;
            result.message = 'device not found.';
        }
    }
    else {
        result.result = false;
        result.message = 'device not online.';
    }
    res.json(result);
}

//云台控制
function ptzControl(req, res) {
    let result = { stat: 'OK' };

    if (this.sessions.has(req.body.deviceId)) {
        let session = this.sessions.get(req.body.deviceId);

        //判断当前设备通道里是否存在通道编码
        let channelId = req.body.channelId;
        let channel = session.catalog.devicelist.find(t => t.DeviceID === channelId);

        if (channel) {
            session.ControlPTZ(req.body.channelId, req.body.controlCode);

            result.message = 'OK';
        }
        else {
            result.stat = 'error';
            result.message = 'device not found.';
        }
    }
    else {
        result.stat = 'error';
        result.message = 'device not online.';
    }
    res.json(result);
}

//录像文件查询
async function recordQuery(req, res) {
    let result = {};

    if (this.sessions.has(req.params.device)) {
        let session = this.sessions.get(req.params.device);

        //判断当前设备通道里是否存在通道编码
        let channelId = req.params.channel;
        let channel = session.catalog.devicelist.find(t => t.DeviceID === channelId);

        if (channel) {
            if (req.params.begin < req.params.end) {

                //unix时间转换
                var beginTime = new Date(req.params.begin * 1000).toJSON();
                var endTime = new Date(req.params.end * 1000).toJSON();

                result.data = await session.getRecordInfos(req.params.channel, beginTime, endTime);

                result.result = true;
                result.message = 'OK';
            }
            else {
                result.result = false;
                result.message = "beginTime 必须小于 endTime.";
            }
        }
        else {
            result.result = false;
            result.message = 'device not found.';
        }
    }
    else {
        result.result = false;
        result.message = 'device not online.';
    }
    res.json(result);
}

//关闭流
function closeStream(req, res) {
    let body = req.body;

    let result = { code: 0, msg: 'success' };

    if (body.stream) {
        //16位进制转10进制
        let ssrc = parseInt(body.stream, 16);
        //要补位

        ssrc = _prefixInteger(ssrc, 10);

        let selectSession = null;
        let selectDialog = null;

        this.sessions.forEach(function (session, id) {
            let dialogs = session.dialogs;
            for (var key in dialogs) {
                let dialog = dialogs[key];
                if (dialog.ssrc && dialog.ssrc === ssrc) {
                    selectSession = session;
                    selectDialog = dialog;
                    return;
                }
            }
        });

        if (selectDialog != null && selectSession != null) {
            if (selectDialog.play) {
                switch (selectDialog.play) {
                    case 'realplay':
                        {
                            selectSession.StopRealPlay(selectDialog.channelId, selectDialog.host, selectDialog.port);
                        }
                        break;
                    case 'playback':
                        {
                            selectSession.StopPlayBack(selectDialog.channelId, selectDialog.begin, selectDialog.end, selectDialog.host, selectDialog.port)
                        }
                        break;
                }
            }
        }
    }

    res.json(result);
}

// zlm监听无人观看事件，不断流
function zlmNoneReader (req, res) {
    const result = { code: 0, close: false };
    res.json(result);
}

// 判断是否存在此流
function hasSsrc(stream, sessions) {
    let result = null
    //16位进制转10进制
    let ssrc = parseInt(stream, 16);
    //要补位
    ssrc = _prefixInteger(ssrc, 10);

    sessions.forEach(function (session) {
        let dialogs = session.dialogs;
        for (var key in dialogs) {
            let dialog = dialogs[key];
            if (dialog.ssrc && dialog.ssrc === ssrc) {
                result = dialogs[key];
            }
        }
    });
    return result
}

// 截图
async function snap(req, res) {
    let body = req.params;

    let result = { stat: 'OK' };

    if (body.stream) {

        const dialog = hasSsrc(body.stream, this.sessions);

        if (dialog) {
            // 发送请求,用zlm截图保存的图片路径不支持自定义,改用fluent-ffmpeg,fluent会报错，使用pipe来接然后写进本地文件夹
            // await axios.pipe(`${config.ZLMediaKit.media_url}index/api/getSnap`, {
            //     secret: config.ZLMediaKit.secret,
            //     url: `${config.ZLMediaKit.media_url}rtp/${body.stream}.flv`,
            //     timeout_sec: 10,
            //     expire_sec: 20
            // }, `${config.ZLMediaKit.snap_path}/${util.formatDate()}`, `${dialog.channelId.substring(17)}.jpeg`);
            // TODO 将原来zlm存的截图记得实时删除掉,看看有没有用axios可以用的方法,免得又要下载request依赖
            await axios.pipe(`${config.ZLMediaKit.media_url}index/api/getSnap`, {
                secret: config.ZLMediaKit.secret,
                url: `${config.ZLMediaKit.media_url}rtp/${body.stream}.flv`,
                timeout_sec: 10,
                expire_sec: 20
            }, `${config.ZLMediaKit.snap_path}${util.formatDate()}`, `${dialog.channelId.substring(17)}.jpeg`)
            .then((res) => {
                if (res.code === 0) {
                    result = res;
                }
            })
            .catch((err) => {
                result = { stat: 'error', message: err };
            });
        } else {
            result = { stat: 'error', message: 'stream not found.' };
        }
        // ffmpeg({source: `rtsp://127.0.0.1:554/${config.ZLMediaKit.app}/${body.stream}`, timeout: 20})
        //     .on('filenames', function (filenames) {
        //         console.log('Will generate ' + filenames.join(', '));
        //     })
        //     .on('end', function () {
        //         console.log('ffmpeg end');
        //     })
        //     .on('stderr', function (stderrLine) {
        //         console.log('Stderr output: ' + stderrLine);
        //     })
        //     .on('error', function (err) {
        //         console.log('Cannot process video: error =', err.message);
        //     })
        //     // .addOption(['-rtsp_transport tcp'])
        //     .screenshots({
        //         count: 1,
        //         // timemarks: [ '00:00:02.000' ],
        //         folder: `${config.ZLMediaKit.customized_path}/${config.ZLMediaKit.vhost}/snap/`,
        //         filename: '11111.jpg',
        //         size: '640x?',
        //         timeout: 20
        //     });
        //     result = { code: 0, msg: 'screenshot success', url: '11111.jpg', folder: `${config.ZLMediaKit.customized_path}/${config.ZLMediaKit.vhost}/snap` };
    } else {
        result = { stat: 'error', message: 'invaild params' };
    }

    res.json(result);
}

// 开始录制
async function startRecord(req, res) {
    let body = req.params;

    let result = { stat: 'OK' };

    if (body.stream) {

        const dialog = hasSsrc(body.stream, this.sessions);
        if (dialog) {
            // TODO  发送请求=>已完成
            const data = await axios.get(`${config.ZLMediaKit.media_url}index/api/startRecord`, {
                secret: config.ZLMediaKit.secret,
                vhost: config.ZLMediaKit.vhost,
                app: config.ZLMediaKit.app,
                stream: body.stream,
                customized_path: config.ZLMediaKit.customized_path,
                type: 1
            });
            result = { ...data, ...result };
        } else {
            result = { stat: 'error', message: 'stream not found.' };
        }
    } else {
        result = { stat: 'error', message: 'invaild params' };
    }

    res.json(result);
}

// 停止录制
async function stopRecord(req, res) {
    let body = req.params;

    let result = { stat: 'OK' };

    if (body.stream) {
        const dialog = hasSsrc(body.stream, this.sessions);
        if (dialog) {
            // TODO  发送请求=>已完成
            const data = await axios.get(`${config.ZLMediaKit.media_url}index/api/stopRecord`, {
                secret: config.ZLMediaKit.secret,
                vhost: config.ZLMediaKit.vhost,
                app: config.ZLMediaKit.app,
                stream: body.stream,
                customized_path: config.ZLMediaKit.customized_path,
                type: 1
            });
            result = { ...data, ...result };
        } else {
            result = { stat: 'error', message: 'stream not found.' };
        }
    } else {
        result = { stat: 'error', message: 'invaild params' };
    }

    res.json(result);
}

// 记录zlm录制时保存的文件路径
function zlmRecordPath (req, res) {
    let result = { stat: 'OK' };

    if (req.body.app === config.ZLMediaKit.app && req.body.vhost === config.ZLMediaKit.vhost) {
        // 10进制转16位进制
        let ssrc = parseInt(req.body.stream, 16).toString();
        ssrc = ssrc.padStart(10, 0);

        this.sessions.forEach(function (session) {
            let dialogs = session.dialogs;
            for (var key in dialogs) {
                let dialog = dialogs[key];
                // TODO 存入数据库中
                if (dialog.ssrc && dialog.ssrc === ssrc) {
                    // dialog.file_path = req.body.file_path // 将录像文件路径存入会话中，每调用一次就更新一次
                    console.log('record', req.body.file_path)
                    res.json(result);
                }
            }
        });
    }
}

// zlm推流鉴权事件
function zlmOnPublish (req, res) {
    res.json({'code': 0, 'msg': 'success'});
}

// zlm监听播放器事件
function zlmOnPlay (req, res) {
    // TODO 考虑是否给摄像头发invite请求=》
    // 如果不存在此ssrc,但每个摄像头已有ssrc且正在推流中则不允许播放
    // 如果存在这个stream(ssrc)但未播放则允许发送invite请求
    res.json({'code': 0, 'msg': 'success'});
    // res.json({'code': 1, 'msg': '该流已断'});
}

function _prefixInteger(num, m) {
    return (Array(m).join(0) + num).slice(-m);
}

module.exports = {
    getCatalog: getCatalog,
    realplay: realplay,
    getSessions: getSessions,
    playback: playback,
    ptzControl: ptzControl,
    playControl: playControl,
    recordQuery: recordQuery,
    closeStream: closeStream,
    snap: snap,
    startRecord: startRecord,
    stopRecord: stopRecord,
    zlmNoneReader: zlmNoneReader,
    zlmRecordPath: zlmRecordPath,
    zlmOnPublish: zlmOnPublish,
    zlmOnPlay: zlmOnPlay
}