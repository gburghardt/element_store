describe("ElementStore", function() {

	describe("Utils", function() {

		describe("_compileElementStore", function() {

			beforeEach(function() {
				this.store = new ElementStore();
				spyOn(this.store, "init");
				spyOn(this.store, "setConfig").andCallThrough();

				this.config = {
					collections: {
						labels: { selector: "label" }
					},
					elements: {
						list: { selector: "ol" }
					}
				};

				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: this.config
					}
				});

				this.Parent = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {
							collections: this.config.collections
						}
					}
				});

				this.Child = this.Parent.extend({
					prototype: {
						elementStore: {
							elements: this.config.elements
						}
					}
				});
			});

			it("compiles the element store config from the prototype", function() {
				expect(this.Klass.prototype._compiledElementStore).toBe(undefined);

				var instance = new this.Klass();
				instance.elementStore = this.store;

				instance._compileElementStore();
				expect(this.store.setConfig).wasCalledWith(this.config, true);
				expect(this.Klass.prototype._compiledElementStore).toEqual(this.config);
			});

			it("compiles the element store config from all parent classes", function() {
				expect(this.Child.prototype._compiledElementStore).toBe(undefined);

				var instance = new this.Child();
				instance.elementStore = this.store;
				instance._compileElementStore();

				expect(this.store.setConfig).wasCalledWith({ collections: this.config.collections }, true);
				expect(this.store.setConfig).wasCalledWith({ elements: this.config.elements }, true);
				expect(this.Child.prototype._compiledElementStore).toEqual(this.config);
				expect(this.Parent.prototype._compiledElementStore).toBe(undefined);
			});

			it("does not recompile the element store config after the first instance", function() {
				var instance = new this.Child();
				instance.elementStore = this.store;

				instance._compileElementStore();

				instance = new this.Child();
				instance.elementStore = this.store;
				instance._compileElementStore();

				expect(this.store.setConfig).wasCalledWith(this.Child.prototype._compiledElementStore);
			});

			it("child class configs override parent class configs", function() {
				var Parent = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {
							elements: {
								title: { selector: "div.title" }
							}
						}
					}
				});

				var Child = Parent.extend({
					prototype: {
						elementStore: {
							elements: {
								title: { selector: "h2" }
							}
						}
					}
				});

				var instance = new Child();
				instance.elementStore = this.store;

				instance._compileElementStore();

				expect(instance.elementStore.config.elements.title.selector).toBe("h2");
			});

		});

		describe("initElementStore", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils
				});
				this.element = document.createElement("div");
			});

			it("instantiates a new element store", function() {
				var instance = new this.Klass();

				expect(instance.elementStore).toEqual({});

				instance.initElementStore(this.element);

				expect(instance.elementStore instanceof ElementStore).toBe(true);
			});

			it("re-uses an existing element store", function () {
				var store = new ElementStore();
				var instance = new this.Klass();
				instance.elementStore = store;
				instance.initElementStore(this.element);

				expect(instance.elementStore).toBe(store);
			});

			it("compiles the element store config, initializes getters and init's the element store", function() {
				var store = new ElementStore();
				spyOn(store, "init");
				spyOn(this.Klass.prototype, "_compileElementStore");
				spyOn(this.Klass.prototype, "_initGetters");

				var instance = new this.Klass();
				instance.elementStore = store;
				instance.initElementStore(this.element);

				expect(this.Klass.prototype._compileElementStore).wasCalled();
				expect(this.Klass.prototype._initGetters).wasCalled();
				expect(store.init).wasCalledWith(this.element);
			});

		});

		describe("_initGetters", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {
							collections: {
								items: { selector: "li" },
								labels: { selector: "label" }
							},
							elements: {
								title: { selector: "h2" }
							}
						},
						createCollectionGetter: function() {},
						createElementGetter: function() {}
					}
				});
				this.store = new ElementStore();
				this.instance = new this.Klass();
				this.instance.elementStore = this.store;
				this.instance._compileElementStore();
				spyOn(this.instance, "createCollectionGetter");
				spyOn(this.instance, "createElementGetter");
			});

			describe("when a property does not already exist", function() {

				beforeEach(function() {
					this.instance._initGetters();
				});

				it("creates an element getter called 'title' for element 'title'", function() {
					expect(this.instance.createElementGetter).wasCalledWith("title", "title");
				});

				it("creates a collection getter called 'foo' for collection 'foo'", function() {
					expect(this.instance.createCollectionGetter).wasCalledWith("items", "items");
					expect(this.instance.createCollectionGetter).wasCalledWith("labels", "labels");
				});

			});

			describe("when a property already exists", function() {

				beforeEach(function() {
					this.Klass.prototype.title = "Don't overwrite me!";
					this.Klass.prototype.items = "Don't overwrite me!";
					this.Klass.prototype.labels = "Don't overwrite me!";
					this.instance._initGetters();
				});

				it("creates an element getter named 'fooElement' for element 'foo'", function() {
					expect(this.instance.createElementGetter).wasCalledWith("title", "titleElement");
				});

				it("creates a collection getter named 'fooCollection' for collection 'foo'", function() {
					expect(this.instance.createCollectionGetter).wasCalledWith("items", "itemsCollection");
					expect(this.instance.createCollectionGetter).wasCalledWith("labels", "labelsCollection");
				});

			});

			describe("when all property name combinations exist", function() {

				it("throws an error when creating an element getter", function () {
					this.Klass.prototype.title = "Don't overwrite me!";
					this.Klass.prototype.titleElement = "Don't overwrite me!";
					var instance = this.instance;

					expect(function() {
						instance._initGetters();
					}).toThrow("Cannot create element getter: title");
				});

				it("throws an error when creating a collection getter", function() {
					this.Klass.prototype.items = "Don't overwrite me!";
					this.Klass.prototype.itemsCollection = "Don't overwrite me!";
					var instance = this.instance;

					expect(function() {
						instance._initGetters();
					}).toThrow("Cannot create collection getter: items");
				});

			});

			it("does not recreate getters after the first instance", function() {
				this.instance._initGetters();
				var instance = new this.Klass();
				instance.elementStore = new ElementStore();
				instance._compileElementStore();

				spyOn(instance, "createCollectionGetter");
				spyOn(instance, "createElementGetter");

				instance._initGetters();

				expect(instance.createCollectionGetter).wasNotCalled();
				expect(instance.createElementGetter).wasNotCalled();
			});

		});

		describe("collection", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {}
					}
				});

				this.store = new ElementStore();
				spyOn(this.store, "getCollection");
				this.instance = new this.Klass();
				this.instance.elementStore = this.store;
			});

			it("delegates to ElementStore#getCollection", function() {
				this.instance.collection("foo");

				expect(this.store.getCollection).wasCalledWith("foo");
			});

		});

		describe("element", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {}
					}
				});

				this.store = new ElementStore();
				spyOn(this.store, "getElement");
				this.instance = new this.Klass();
				this.instance.elementStore = this.store;
			});

			it("delegates to ElementStore#getElement", function() {
				this.instance.element("foo");

				expect(this.store.getElement).wasCalledWith("foo");
			});

		});

		describe("_createCollectionGetter", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {}
					}
				});

				this.store = new ElementStore();
				spyOn(this.store, "getCollection");

				this.instance = new this.Klass();
				this.instance.elementStore = this.store;
			});

			it("creates a getter for a specific collection on the prototype", function() {
				this.instance._createCollectionGetter("labels", "labels");

				expect(typeof(this.instance.labels)).toBe("function");
			});

			it("delegates to ElementStore#getCollection", function() {
				this.instance._createCollectionGetter("labels", "labels");
				this.instance.labels();

				expect(this.store.getCollection).wasCalledWith("labels");
			});

			it("creates a method by a different name than the key", function() {
				this.instance._createCollectionGetter("labels", "labelsCollection");

				expect(typeof(this.instance.labelsCollection)).toBe("function");

				this.instance.labelsCollection();

				expect(this.store.getCollection).wasCalledWith("labels");
			});

		});

		describe("_createElementGetter", function() {

			beforeEach(function() {
				this.Klass = Object.extend({
					includes: ElementStore.Utils,

					prototype: {
						elementStore: {}
					}
				});

				this.store = new ElementStore();
				spyOn(this.store, "getElement");

				this.instance = new this.Klass();
				this.instance.elementStore = this.store;
			});

			it("creates a getter for a specific element on the prototype", function() {
				this.instance._createElementGetter("title", "title");

				expect(typeof(this.instance.title)).toBe("function");
			});

			it("delegates to ElementStore#getElement", function() {
				this.instance._createElementGetter("title", "title");
				this.instance.title();

				expect(this.store.getElement).wasCalledWith("title");
			});

			it("creates a method by a different name than the key", function() {
				this.instance._createElementGetter("title", "titleElement");

				expect(typeof(this.instance.titleElement)).toBe("function");

				this.instance.titleElement();

				expect(this.store.getElement).wasCalledWith("title");
			});

		});

	});

});
