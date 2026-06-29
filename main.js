#!/usr/bin/env node
import fs from "node:fs";
import { runSource } from "./bwfa.js";
function readline() {
  let ret = "";
  const buf = Buffer.alloc(1);
  while (true) {
    const bytesRead = fs.readSync(process.stdin.fd, buf, 0, 1);
    if (!bytesRead || buf[0] == 10) return ret;
    ret += String.fromCharCode(buf[0]);
  }
}
fs.readFile(process.argv[process.argv.length - 1], "utf8", (err, board) => {
  runSource(board, {
    "": {
      p: (x) => process.stdout.write(String.fromCharCode(x)),
      c: () => readline().charCodeAt(0) | 0,
      m: new WebAssembly.Memory({ initial: 1 }),
    },
  });
});
