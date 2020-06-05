const DefaultPort = 80;

const Path = require('path');
const FS = require('fs');

require("./core");
loadall("./core/commandline");
require("./common");

const webServer = require('./server');

const CLP = _('CL.CLP');
const setStyle = _('CL.SetStyle');

// 系统参数
const CSP_Name = "游戏广场（GamePort）";
const CSP_Version = "0.0.1";

// 配置命令行工具
const clp = CLP({
	mode: 'process',
	title: CSP_Name + " v" + CSP_Version,
})
.describe(setStyle(CSP_Name + " v" + CSP_Version, "bold"))
.addOption('--port -p [port=' + DefaultPort + '] >> 指定端口')
.on('command', async (param, command) => {
	webServer(param.port || DefaultPort, () => {
		console.log(setStyle('游戏中心启动！', 'bold'));
	});
})
;

clp.launch();