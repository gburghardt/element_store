describe("ElementStore", function() {

	beforeEach(function() {
		this.element = document.createElement("div");
		this.store = new ElementStore();
	});

	describe("setRoot", function() {

		beforeEach(function() {
			spyOn(this.store, "clearCache");
		})

		it("clears the cache", function() {
			this.store.setRoot(this.element);

			expect(this.store.clearCache).wasCalled();
		});

		it("sets the new root element", function() {
			this.store.setRoot(this.element);

			expect(this.store._root).toBe(this.element);
		});

		it("sets the document from the root element", function() {
			this.store.setRoot(this.element);

			expect(this.store._document).toBe(this.element.ownerDocument);
		});

	});

	describe("setConfig", function() {

		beforeEach(function() {
			this.store.config = {
				elements: {
					foo: ".baz"
				},
				collections: {
					test: ".test"
				}
			};
		})

		it("merges in new element configs", function() {
			var overrides = {
				elements: {
					foo: { selector: ".foo" },
					bar: { selector: ".bar" }
				}
			};

			this.store.setConfig(overrides);

			expect(this.store.config.elements.foo).toEqual({ selector: ".foo" });
			expect(this.store.config.elements.bar).toEqual({ selector: ".bar" });
		});

		it("merges in new collection configs", function() {
			var overrides = {
				collections: {
					list: { selector: "ul" },
					test: { selector: "button.test" }
				}
			};

			this.store.setConfig(overrides);

			expect(this.store.config.collections.list).toEqual({ selector: "ul" });
			expect(this.store.config.collections.test).toEqual({ selector: "button.test" });
		});

	});

	describe("init", function() {

		it("requires a root element", function() {
			this.store.init(this.element);
		});

		it("throws an error if the root element is missing", function() {
			var store = this.store;

			expect(function() {
				store.init();
			}).toThrow("Missing required argument: root");
		});

		it("eager loads elements", function() {
			spyOn(this.store, "eagerLoad");
			this.store.init(this.element);

			expect(this.store.eagerLoad).wasCalled();
		});

	});

	describe("getCollection", function() {

		beforeEach(function() {
			this.config = {
				collections: {
					list: { selector: "ul" },
					button: { selector: "button[type=submit]" },
					badItem: {}
				}
			};
			this.element = document.createElement("div");
			this.store.config = this.config;
			this.store.init(this.element);
		});

		it("returns null if the key is not in the collection config", function() {
			expect(this.store.getCollection("non_existent")).toBe(null);
		});

		it("returns a cached collection", function() {
			var ul = document.createElement("ul");
			this.store._cache.list = ul;
			spyOn(this.store, "querySelectorAll");

			expect(this.store.getCollection("list")).toBe(ul);
			expect(this.store.querySelectorAll).wasNotCalled();
		});

		it("finds a collection by selector", function() {
			var ul = document.createElement("ul");
			spyOn(this.store, "querySelectorAll").andReturn(ul);

			expect(this.store._cache.list).toBe(undefined);
			expect(this.store.getCollection("list")).toBe(ul);
			expect(this.store._cache.list).toBe(ul);
			expect(this.store.querySelectorAll).wasCalledWith(this.config.collections.list.selector);
		});

		it("throws an error if the collection config does not have a 'selector' property", function() {
			spyOn(this.store, "querySelectorAll");
			var store = this.store;

			expect(function() {
				store.getCollection("badItem");
			}).toThrow("Missing required config \"selector\" for collection badItem");

			expect(this.store.querySelectorAll).wasNotCalled();
		});

		it("does not cache collections marked as 'nocache' in the config", function() {
			this.store.setConfig({
				collections: {
					items: {
						selector: "li",
						nocache: true
					}
				}
			});

			var items = [
				document.createElement("li"),
				document.createElement("li")
			];

			spyOn(this.store, "querySelectorAll").andReturn(items);
			this.store.getCollection("items");

			expect(this.store.querySelectorAll).wasCalledWith(this.store.config.collections.items.selector);
			expect(this.store._cache.items).toBe(undefined);
		});

	});

	describe("getElement", function() {

		beforeEach(function() {
			this.config = {
				elements: {
					list: { selector: "ul" },
					button: { selector: "button[type=submit]" },
					badItem: {}
				}
			};
			this.element = document.createElement("div");
			this.store.config = this.config;
			this.store.init(this.element);
		});

		it("returns null if the key is not in the element config", function() {
			expect(this.store.getElement("non_existent")).toBe(null);
		});

		it("returns a cached element", function() {
			var ul = document.createElement("ul");
			this.store._cache.list = ul;
			spyOn(this.store, "querySelector");

			expect(this.store.getElement("list")).toBe(ul);
			expect(this.store.querySelector).wasNotCalled();
		});

		it("finds an element by selector", function() {
			var ul = document.createElement("ul");
			spyOn(this.store, "querySelector").andReturn(ul);

			expect(this.store._cache.list).toBe(undefined);
			expect(this.store.getElement("list")).toBe(ul);
			expect(this.store._cache.list).toBe(ul);
			expect(this.store.querySelector).wasCalledWith(this.config.elements.list.selector);
		});

		it("throws an error if the element config does not have a 'selector' property", function() {
			spyOn(this.store, "querySelector");
			var store = this.store;

			expect(function() {
				store.getElement("badItem");
			}).toThrow("Missing required config \"selector\" for element badItem");

			expect(this.store.querySelector).wasNotCalled();
		});

		it("does not cache elements marked as 'nocache' in the config", function() {
			this.store.setConfig({
				elements: {
					list: {
						selector: "ul",
						nocache: true
					}
				}
			});

			var list = document.createElement("ul");

			spyOn(this.store, "querySelector").andReturn(list);
			this.store.getElement("list");

			expect(this.store.querySelector).wasCalledWith(this.store.config.elements.list.selector);
			expect(this.store._cache.list).toBe(undefined);
		});

	});

	describe("clearCache", function() {

		beforeEach(function() {
			this.store.init(this.element);
		});

		it("nullifies references to DOM nodes in the cache", function() {
			this.store._cache.list = document.createElement("ul");
			this.store._cache.divs = document.getElementsByTagName("div");

			this.store.clearCache();

			expect(this.store._cache.list).toBe(null);
			expect(this.store._cache.divs).toBe(null);
		});

	});

	describe("eagerLoad", function() {

		describe("collections", function() {

			beforeEach(function() {
				this.config = {
					collections: {
						labels: { selector: "label", eager: true },
						dropdowns: { selector: "select", eager: true, nocache: true },
						headers: { selector: "h2" }
					},
					elements: {}
				};
				this.store.config = this.config;
				this.store._cache = {};
				// stub this function for testing purposes
				this.store.querySelectorAll = function() {};
				spyOn(this.store, "querySelectorAll");
			});

			it("loads collections marked as 'eager' and not 'nocache'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelectorAll).wasCalledWith("label");
			});

			it("ignores collections not marked as 'eager'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelectorAll).wasNotCalledWith("h2");
			});

			it("ignores collections marked as 'nocache'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelectorAll).wasNotCalledWith("select");
			});

		});

		describe("elements", function() {

			beforeEach(function() {
				this.config = {
					collections: {},
					elements: {
						button: { selector: "button", eager: true },
						title: { selector: "h2", eager: true, nocache: true },
						footer: { selector: ".footer" }
					}
				};
				this.store.config = this.config;
				this.store._cache = {};
				// stub this function for testing purposes
				this.store.querySelector = function() {};
				spyOn(this.store, "querySelector");
			});

			it("loads elements marked as 'eager' and not 'nocache'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelector).wasCalledWith("button");
			});

			it("ignores elements not marked as 'eager'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelector).wasNotCalledWith(".footer");
			});

			it("ignores elements marked as 'nocache'", function() {
				this.store.eagerLoad();

				expect(this.store.querySelector).wasNotCalledWith("h2");
			});

		});

	});

	describe("get", function() {

		beforeEach(function() {
			this.config = {
				collections: {
					items: { selector: "li" }
				},
				elements: {
					button: { selector: "button" }
				}
			};
			this.button = document.createElement("button");
			this.items = [
				document.createElement("li"),
				document.createElement("li")
			];
			this.store.setConfig(this.config);
			this.store.init(this.element);
		});

		it("returns an element", function() {
			spyOn(this.store, "getElement").andReturn(this.button);
			spyOn(this.store, "getCollection");

			var element = this.store.get("button");

			expect(element).toBe(this.button);
			expect(this.store.getElement).wasCalledWith("button");
			expect(this.store.getCollection).wasNotCalled();
		});

		it("returns a collection", function() {
			spyOn(this.store, "getElement").andReturn(null);
			spyOn(this.store, "getCollection").andReturn(this.items);

			var elements = this.store.get("items");

			expect(elements).toBe(this.items);
			expect(this.store.getElement).wasCalledWith("items");
			expect(this.store.getCollection).wasCalledWith("items");
		});

	});

	describe("keys", function() {

		it("returns an array of all keys in the element and collection configs", function() {
			this.store.setConfig({
				collections: {
					items: { selector: "li" },
					labels: { selector: "label" }
				},
				elements: {
					button: { selector: "button" },
					title: { selector: "h2" }
				}
			});

			var expectedKeys = ["items", "labels", "button", "title"].sort().join(",");
			var actualKeys = this.store.keys().sort().join();

			expect(actualKeys).toEqual(expectedKeys);
		});

	});

	describe("destructor", function() {

		it("clears the cache and nullifies object references", function() {
			this.store.setConfig({
				collections: {
					labels: { selector: "label" }
				},
				elements: {
					title: { selector: "h2" }
				}
			});
			this.store.init(this.element);
			this.store._cache.labels = [
				document.createElement("label"),
				document.createElement("label")
			];
			this.store._cache.title = document.createElement("h2");

			spyOn(this.store, "clearCache").andCallThrough();

			expect(this.store._root).toBe(this.element);
			expect(this.store._document).toBe(this.element.ownerDocument);

			this.store.destructor();

			expect(this.store.clearCache).wasCalled();
			expect(this.store._cache).toBe(null);
			expect(this.store._root).toBe(null);
			expect(this.store._document).toBe(null);
			expect(this.store.config).toBe(null);
		});

	});

});
