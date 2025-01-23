const config = require("../config/config.js")
const initialManager = {
    managerID: config.managerID,
    createdBy: config.createdBy,
    managerIndex: config.managerIndex,
    oStatus: config.oStatus,
    password: config.password,
    serverConfig: config.serverConfig,
    serverCode: config.serverCode,
    oDemo: config.oDemo,
    mt4_mt5: config.mt4_mt5,
}

module.exports = {
    initialManager
}