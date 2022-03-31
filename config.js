var config = module.exports = {
    GB28181: {
        sipServer: {
            ping: 60,//心跳周期（秒）
            ping_timeout: 3,//最大心跳超时次数
            expires: 3600,//注册有效期（秒）
            host: '192.168.0.37',//SIP服务器通讯IP地址,如果使用内网映射到公网IP需要设置为公网IP地址
            serial: '42000000402000000001',//SIP服务器编号
            listen: 5060,//SIP通信端口
            realm: '4200000040',//SIP服务器域
            password: '12345678',//默认密码
            ack_timeout: 30,//服务端发送ack后，接收回应的超时时间，单位为秒,如果指定时间没有回应，认为失败
        }
    },
    VAG: {
        http: {
            port: 8001,
            allow_origin: '*'
        },
        auth: {
            api: false,
            api_user: 'admin', //default admin
            api_pass: 'admin', //default admin
            play: false,
            publish: false,
            secret: 'nodemedia2017privatekey'
        }
    },
    // ZLMediaKit服务器配置
    ZLMediaKit: {
        media_url: 'http://192.168.0.37:9094/',
        secret: '035c73f7-bb6b-4889-a715-d9eb2d1925cc',
        vhost: '__defaultVhost__',
        app: 'rtp',
        customized_path: encodeURI('D://毕设相关'), // 录像的保存路径,有中文才需要encodeURI
        snap_path: 'D://毕设相关/__defaultVhost__/snap/'
    }
};