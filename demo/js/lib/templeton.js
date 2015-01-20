(function(g, f) {
	if (typeof define==='function' && define.amd)
		define([], f);
	else if (typeof module==='object' && module.exports)
		module.exports = f();
	else
		g.templeton = f();
}(this, function() {
	var keyPath = /(\.{2,}|\[(['"])([^\.]*?)\1\])/g,
		trimDots = /(^\.|\.$)/g,
		empty = {},
		templeton;

	function execHelper(name, text) {
		var parts = name.split(':'),
			id = parts[0],
			h = templeton.helpers[id];
		if (typeof h==='string') {
			return templeton.template(h, text);
		}
		parts.splice(0, 1, text);
		return h.apply(templeton.helpers, parts);
	}

	/** A simple template engine with iterators and extensible block helpers */
	return (templeton = {

		/** Allow "~" and "__path__" special keys? */
		extendedKeys : true,

		/** Helpers can be simple templates, or transformation functions */
		helpers : {
			link : '<a href="{{href}}">{{title}}</a>',

			html : function(v) {
				return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
			},

			escape : function(v) {
				return encodeURIComponent(v);
			},

			json : function(v) {
				return JSON.stringify(v);
			}
		},

		/** Custom modifiers registered as single-character key prefixes */
		refs : {
			/*
			// Example ref: "{{@greeting.welcome}}"
			'@' : function(fields, key, fallback) {
				return templeton.delve(fields, 'locale.'+key, fallback);
			}
			*/
		},

		/**	Deal with types of blocks */
		blockHelpers : {

			_default : function(ctx) {
				return this[ (ctx.value && ctx.value.splice) ? 'each' : 'if' ](ctx);
			},

			/** Basic iterator */
			each : function(ctx) {
				var out='', p, fields,
					top = ctx.fields,
					obj = ctx.value;
				if (templeton.extendedKeys!==false) {
					fields = {
						'~' : top,
						__path__ : ctx.id==='.' ? ctx.path : ctx.id
					};
				}
				for (p in obj) {
					if (obj.hasOwnProperty(p)) {
						if (fields) {
							fields.__key__ = p;
						}
						out += templeton.template(ctx.content, obj[p], fields);
					}
				}
				return out;
			},

			/** Conditional block */
			'if' : function(ctx) {
				return ctx.value ? templeton.template(ctx.content, ctx.fields, ctx.overrides) : '';
			},

			/** Conditional block (inverted) */
			'else' : function(ctx) {
				return ctx.value ? '' : templeton.template(ctx.content, ctx.fields, ctx.overrides);
			},

			'unless' : function(ctx) {
				return this['else'](ctx);
			}

		},

		/** The guts. */
		template : function(text, fields, _overrides) {
			var tokenizer = /\{\{\{?([#\/\:]?)([^ \{\}\|]+)(?: ([^\{\}\|]*?))?(?:\|([^\{\}]*?))?\}?\}\}/g,
				out = '',
				t, j, r, f, index, mods, token, html,
				stack = [],
				ctx;
			ctx = {
				fields : fields || {},
				overrides : _overrides || empty
			};
			ctx.path = (ctx.overrides.__path__?(ctx.overrides.__path__+'.'):'')+ctx.overrides.__key__;
			tokenizer.lastIndex = 0;
			while ( (token=tokenizer.exec(text)) ) {
				if (stack.length===0) {
					out += text.substring(index || 0, tokenizer.lastIndex - token[0].length);
				}
				t = token[1];
				if (!t || (t!=='#' && t!==':' && t!=='/')) {
					f = token[2];
					if (stack.length===0) {
						if (t) {
							r = templeton.refs[t](fields, f, null);
						}
						else {
							r = ctx.overrides[f] || templeton.delve(fields, f, null);
						}
						if (r===null) {
							out += token[0];
						}
						else {
							html = token[0].charAt(2)!=='{';
							if (token[4]) {
								mods = token[4].split('|');
								for (j=0; j<mods.length; j++) {
									if (templeton.helpers.hasOwnProperty(mods[j])) {
										if (mods[j]==='html') {
											html = false;
										}
										r = execHelper(mods[j], r);
									}
								}
							}
							if (html) {
								r = templeton.helpers.html(r);
							}
							out += r;
						}
					}
				}
				else {
					if (t==='/' || t===':') {
						ctx.id = stack.pop();
						ctx.value = ctx.overrides[ctx.id] || templeton.delve(fields, ctx.id, null);
						if (stack.length===0) {
							ctx.content = text.substring(ctx.blockStart, tokenizer.lastIndex - token[0].length);
							r = templeton.blockHelpers[ctx.blockHelper](ctx);
							if (r && typeof(r)==='string') {
								out += r;
							}
						}
						ctx.previousBlockHelper = ctx.blockHelper;
						ctx.previousId = ctx.id;
						ctx.previousValue = ctx.value;
					}
					if (t==='#' || t===':') {
						if (!token[3]) token.splice(2, 0, '_default');
						stack.push(t===':' ? ctx.id : token[3]);
						if (stack.length===1) {
							ctx.blockHelper = token[2];
							ctx.blockStart = tokenizer.lastIndex;
						}
						index = null;
					}
				}
				index = tokenizer.lastIndex;
			}
			out += text.substring(index);
			return out;
		},

		delve : function(obj, key, fallback) {
			var c=obj, i, l;
			if (key==='.') {
				return obj.hasOwnProperty('.') ? obj['.'] : obj;
			}
			if (key.indexOf('.')===-1) {
				return obj.hasOwnProperty(key) ? obj[key] : fallback;
			}
			if (key.indexOf('[')!==-1) {
				key = key.replace(keyPath,'.$2');
			}
			key = key.replace(trimDots,'').split('.');
			for (i=0, l=key.length; i<l; i++) {
				if (!c.hasOwnProperty(key[i])) {
					return fallback;
				}
				c = c[key[i]];
			}
			return c;
		}
	});
}));
