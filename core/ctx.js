
const EventEmitter = require("events");

let sessions = new Map();

let nodeEvent = new EventEmitter();

module.exports = { sessions, nodeEvent };
