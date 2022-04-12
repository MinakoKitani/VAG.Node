const NodeAPIServer = require("./api/server");
const NodeGB28181Server = require("./GB28181Server");
const config = require("./config");

// 信令服务
let vagSignalService = new NodeGB28181Server(config);
vagSignalService.run();

// 网关API服务
let vagAPIService = new NodeAPIServer(config);
vagAPIService.run();
