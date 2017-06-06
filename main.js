#!/bin/node
var fuck = require("./bwfa");
var fs = require("fs");
function readline() {
	var ret = "";
	var buf = new Buffer(1);
	while (true) {
		var bytesRead = fs.readSync(process.stdin.fd, buf, 0, 1);
		if (!bytesRead || buf[0] == 10) return ret;
		ret += String.fromCharCode(buf[0]);
	}
}
fs.readFile(process.argv[process.argv.length-1], 'utf8', (err, board) => {
	fuck.runSource(board, { "": {
		p: x => process.stdout.write(String.fromCharCode(x)),
		c: () => readline().charCodeAt(0)|0,
		m: new WebAssembly.Memory({ initial: 1 }),
	}});
});
