(function(){"use strict";
const fuck = require("./bwfa");
const taBoard = document.getElementById("taBoard");
const prOut = document.getElementById("prOut");
function handle(s, e) {
	const imp = {
		"": {
			p: x => prOut.textContent += String.fromCharCode(x),
			c: () => prompt("Character", "").charCodeAt(0)|0,
			m: new WebAssembly.Memory({ initial: 1 }),
		}
	};
	prOut.textContent = "";
	fuck.runSource(taBoard.value, imp);
}
document.getElementById("btnRun").addEventListener("click", handle);
})();
