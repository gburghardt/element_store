function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

	_root: null,

	constructor: ElementStore

	init: function init(root) {
		if (!root) {
			throw new Error("Missing required argument: root");
		}

		this.config = this.config || { elements: {}, collections: {} };
		this._cache = {};
		this.setRoot(root);

		if (!this.querySelector) {
			this.querySelector = this._querySelector;
		}

		if (!this.querySelectorAll) {
			this.querySelectorAll = this._querySelectorAll;
		}

		this._eagerLoad();

		return this;
	},

	destructor: function destructor() {
		if (this._cache) {
			this.clear();
			this._cache = null;
		}

		this.config = this._root = this._document = null;
	},

	clear: function clear() {
		var key;

		for (key in this._cache) {
			if (this._cache.hasOwnProperty(key)) {
				this._cache[key] = null;
			}
		}

		return this;
	},

	_eagerLoad: function _eagerLoad() {
		var key, conf;

		for (key in this.configs.elements) {
			if (this.configs.elements.hasOwnProperty(key)) {
				conf = this.configs.elements[key];

				if (conf.eager && !conf.nocache) {
					this._cache[key] = this.getElement(key);
				}
			}
		}

		for (key in this.configs.collections) {
			if (this.configs.collections.hasOwnProperty(key)) {
				conf = this.configs.collections[key];

				if (conf.eager && !conf.nocache) {
					this.getCollection(key);
				}
			}
		}
	},

	get: function get(key) {
		return this.getElement(key) || this.getCollection(key) || null;
	},

	getCollection: function getCollection(key) {
		var collection;

		if (!this.config.collections[key]) {
			collection = null;
		}
		else if (this._cache[key]) {
			collection = this._cache[key];
		}
		else if (this.config.collections[key].selector) {
			collection = this.querySelectorAll(this.config.collections[key].selector);

			if (!this.config.collections[key].nocache) {
				this._cache[key] = collection;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for collection " + key);
		}

		return collection;
	},

	getElement: function getElement(key) {
		var element;

		if (!this.config.elements[key]) {
			element = null;
		}
		else if (this._cache[key]) {
			element = this._cache[key];
		}
		else if (this.config.elements[key].selector) {
			element = this.querySelector(this.config.elements[key].selector);

			if (!this.config[key].nocache) {
				this._cache[key] = element;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for element " + key);
		}

		return element;
	},

	keys: function keys() {
		var keys = [], key;

		for (key in this.configs.elements) {
			if (this.configs.elements.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		for (key in this.configs.collections) {
			if (this.configs.collections.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	_mergeConfigs: function _mergeConfigs(configs, overrides) {
		for (key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				configs[key] = overrides[key];
			}
		}
	},

	setConfig: function setConfig(overrides) {
		if (config.elements) {
			this._mergeConfigs(this.config.elements, overrides.elements)
		}

		if (config.collections) {
			this._mergeConfigs(this.config.collections, overrides.collections)
		}

		return this;
	},

	setRoot: function setRoot(root) {
		this.clear();
		this._root = root;
		this._document = this._root.nodeName === "#document" ? this._root : this._root.ownerDocument;

		return this;
	},

	toString: function toString() {
		return "[object ElementStore]";
	},

	_querySelector: function _querySelector(selector) {
		return this._root.querySelector(selector);
	},

	_querySelectorAll: function _querySelectorAll(selector) {
		return this._root.querySelectorAll(selector);
	}

};
