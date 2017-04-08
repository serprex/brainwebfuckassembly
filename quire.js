"use strict"
var require=(function(o){var M={},a=/[^/]+\/\.\.\//,r=function(x,p){
x=(p||"")+x.replace(/^\.\//,"")
while(x.match(a))x=x.replace(a,"")
return(M[x]||o)(x)}
r.f=function(p,f){var m={},j=p.lastIndexOf("/"),s=~j?p.slice(0,j+1):""
M[p]=function(){return m.exports||(f(m,m.exports={},function(x){return r(x,s)}),m.exports)}}
return r})(typeof require!="undefined"&&require);require.f('bwfa',function(module,exports,require){"use strict";
function varint (v, value) {
	while (true) {
		let b = value & 127;
		value >>= 7;
		if ((!value && ((b & 0x40) == 0)) || ((value == -1 && ((b & 0x40) == 0x40)))) {
			return v.push(b);
		}
		else {
			v.push(b | 128);
		}
	}
}


function varuint (v, value) {
	while (true) {
		let b = value & 127;
		value >>= 7;
		if (value) {
			v.push(b | 128);
		} else {
			return v.push(b);
		}
	}
}

function pushString(v, str) {
	for (let i=0; i<str.length; i++) {
		v.push(str.charCodeAt(i));
	}
}

function pushArray(sink, data) {
	return Array.prototype.push.apply(sink, data);
}

function bfCompile(ir, imports) {
	const bc = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

	bc.push(1); // Types

	const type = [3];

	// i32 -> void
	type.push(0x60, 1, 0x7f, 0);
	// void -> i32
	type.push(0x60, 0, 1, 0x7f);
	// void -> void
	type.push(0x60, 0, 0);

	varuint(bc, type.length);
	pushArray(bc, type);

	bc.push(2); // Imports

	const imp = [3];
	varuint(imp, 0);
	varuint(imp, 1);
	pushString(imp, "p");
	imp.push(0, 0);

	varuint(imp, 0);
	varuint(imp, 1);
	pushString(imp, "c");
	imp.push(0, 1);

	varuint(imp, 0);
	varuint(imp, 1);
	pushString(imp, "m");
	imp.push(2, 0);
	varuint(imp, 1);

	varuint(bc, imp.length);
	pushArray(bc, imp);

	bc.push(3); // Funcs

	const functions = [1];

	// types: sequence of indices into the type section
	varuint(functions, 2);

	varuint(bc, functions.length);
	pushArray(bc, functions);

	bc.push(7); // Exports

	const exports = [1];

	// entries: repeated export entries as described below

	exports.push(1);
	pushString(exports, "f");
	exports.push(0);
	exports.push(2);

	varuint(bc, exports.length);
	pushArray(bc, exports);

	bc.push(10); // Codes

	const code = [1];

	const body = [];

	// locals
	varuint(body, 1);
	varuint(body, 2);
	body.push(0x7f);

	ir = ir.replace(/[^\[\]<>.,+-]/g, '');
	var i=0;
	while (i<ir.length) {
		let j;
		switch (ir[i]) {
			case '+':
				j = 1;
				while (ir[i+j] == '+') j++;
				body.push(0x20, 0, 0x20, 0, 0x2d, 0, 0, 0x41);
				varint(body, j&255);
				body.push(0x6a, 0x3a, 0, 0);
				i += j;
				break;
			case '-':
				j = 1;
				while (ir[i+j] == '-') j++;
				body.push(0x20, 0, 0x20, 0, 0x2d, 0, 0, 0x41);
				varint(body, j&255);
				body.push(0x6b, 0x3a, 0, 0);
				i += j;
				break;
			case '>':
				j = 1;
				while (ir[i+j] == '>') j++;
				body.push(0x20, 0, 0x41);
				varint(body, j);
				body.push(0x6a, 0x21, 0);
				i += j;
				break;
			case '<':
				j = 1;
				while (ir[i+j] == '<') j++;
				body.push(0x20, 0, 0x41);
				varint(body, j);
				body.push(0x6b, 0x21, 0);
				i += j;
				break;
			case '.':
				body.push(0x20, 0, 0x2d, 0, 0, 0x10, 0);
				i++;
				break;
			case ',':
				body.push(0x20, 0, 0x10, 1, 0x3a, 0, 0);
				i++;
				break;
			case '[': {
				for (j = i+1; j < ir.length && !/[<>+-]/.test(ir[j]); j++);
				if (j < ir.length && ir[j] == ']') {
					let diffs = [], dv = 0, mindv = 0;
					for (let i2 = i+1; i2 < j; i2++) {
						switch (ir[i2]) {
							case '+':diffs[dv]=(diffs[dv]||0)+1;break;
							case '-':diffs[dv]=(diffs[dv]||0)-1;break;
							case '>':dv++;break;
							case '<':dv--;break;
						}
						if (dv < mindv) mindv = dv;
					}
					if (dv == 0 && (diffs[0] == -1 || diffs[0] == 1)) {
						if (mindv < 0) {
							body.push(0x20, 0, 0x41);
							varint(body, -mindv);
							body.push(0x4f, 0x04, 0x40);
						}
						for (let key in diffs) {
							let k = +key;
							if (k && (dv = diffs[key])) {
								if (k > 0) {
									body.push(0x20, 0, 0x20, 0, 0x2d, 0);
									varuint(body, k);
								} else {
									body.push(0x20, 0, 0x41);
									varint(body, -k);
									body.push(0x6b, 0x22, 1, 0x20, 1, 0x2d, 0, 0);
								}
								body.push(0x20, 0, 0x2d, 0, 0);
								if (dv > 1 || dv < -1) {
									body.push(0x41);
									varint(body, dv);
									body.push(0x6c);
								}
								body.push(~dv ? 0x6a : 0x6b, 0x3a, 0);
								if (k > 0) {
									varuint(body, k);
								} else {
									body.push(0);
								}
							}
						}
						if (mindv < 0) {
							body.push(0x0b);
						}
						let finalval = 0;
						while (ir[j+1] == '+' || ir[j+1] == '-') {
							finalval += ir[j+1] == '+' ? 1 : -1;
							j++;
						}
						body.push(0x20, 0, 0x41);
						varint(body, finalval);
						body.push(0x3a, 0, 0);
						i = j + 1;
						break;
					}
				}
				body.push(0x20, 0, 0x2d, 0, 0, 0x04, 0x40, 0x03, 0x40);
				i++;
				break;
			}
			case ']':
				body.push(0x20, 0, 0x2d, 0, 0, 0x0d, 0, 0x0b, 0x0b);
				i++;
				break;
			default:i++;
		}
	}

	body.push(0x0b);

	varuint(code, body.length);

	pushArray(code, body);

	varuint(bc, code.length);
	pushArray(bc, code);

	return WebAssembly.instantiate(new Uint8Array(bc), imports);
}

exports.runSource = function(board, imp){
	console.time("start");
	return bfCompile(board, imp).then(f => {
		f.instance.exports.f();
		console.timeEnd("start");
	});
}
});