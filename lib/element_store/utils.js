// @requires ElementStore

ElementStore.Utils = {
	prototype: {
		elementStore: {},

		initElementStore: function initElementStore(root) {
			if (!this.hasOwnProperty("elementStore")) {
				this.elementStore = new ElementStore();
			}

			this._compileElementStore();
			this._initGetters();
			this.elementStore.init(root);
		},

		_initGetters: function _initGetters() {
			// TODO: getter function or getter properties
		},

		collection: function collection(key) {
			return this.elementStore.getCollection(key);
		},

		_compileElementStore: function _compileElementStore() {
			var proto = this;

			this.elementStore.config = { elements: {}, collections: {} };

			while (proto = proto.__proto__) {
				if (proto.hasOwnProperty("elementStore")) {
					this.elementStore.setConfig(proto.elementStore);
				}

				proto = proto.__proto__;
			}
		},

		element: function element(key) {
			return this.elementStore.getElement(key);
		}
	}
};
