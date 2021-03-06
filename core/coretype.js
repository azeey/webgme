/*
 * Copyright (C) 2012 Vanderbilt University, All rights reserved.
 * 
 * Author: Miklos Maroti
 */

define([ "util/assert", "core/core", "core/tasync" ], function(ASSERT, Core, TASYNC) {
	"use strict";

	// ----------------- CoreType -----------------

	var CoreType = function(oldcore) {
		// copy all operations
		var core = {};
		for ( var key in oldcore) {
			core[key] = oldcore[key];
		}

		// ----- validity

		function __test(text, cond) {
			if (!cond) {
				throw new Error(text);
			}
		}

		function isValidNode(node) {
			try {
				__test("core", oldcore.isValidNode(node));
				__test("base", typeof node.base === "object");
				return true;
			} catch (error) {
				console.log("Wrong node", error.stack);
				return false;
			}
		}

		core.isValidNode = isValidNode;

		// ----- navigation

		core.getBase = function(node) {
			ASSERT(isValidNode(node));

			// TODO: check if base has moved
			return node.base;
		};

		core.loadRoot = function(hash) {
			TASYNC.call(__loadRoot2, oldcore.loadRoot(hash));
		};

		function __loadRoot2(node) {
			ASSERT(typeof node.base === "undefined");

			node.base = null;
			return node;
		}

		core.loadChild = function(node, relid) {
			ASSERT(isValidNode(node));
			return TASYNC.call(__loadBase, oldcore.loadChild(node, relid));
		};

		core.loadByPath = function(node, path) {
			ASSERT(isValidNode(node));
			return TASYNC.call(__loadBase, oldcore.loadByPath(node, path));
		};

		core.loadPointer = function(node, name) {
			ASSERT(isValidNode(node));
			return TASYNC.call(__loadBase, oldcore.loadPointer(node, name));
		};

		function __loadBase(node) {
			ASSERT(typeof node.base === "undefined" || typeof node.base === "object");

			if (typeof node.base === "undefined") {
				return TASYNC.call(__loadBase2, node, oldcore.loadPointer(node, "base"));
			} else {
				// TODO: check if base has moved
				return node;
			}
		}

		function __loadBase2(node, target) {
			ASSERT(typeof node.base === "undefined");

			node.base = target || null;
			return node;
		}

		core.loadChildren = function(node) {
			ASSERT(isValidNode(node));
			return TASYNC.call(__loadBaseArray, oldcore.loadChildren(node));
		};

		core.loadCollection = function(node, name) {
			ASSERT(isValidNode(node));
			return TASYNC.call(__loadBaseArray, oldcore.loadCollection(node, name));
		};

		function __loadBaseArray(nodes) {
			ASSERT(nodes instanceof Array);

			for ( var i = 0; i < nodes.length; ++i)
				nodes[i] = __loadBase(nodes[i]);

			return TASYNC.lift(nodes);
		}

		// ----- creation

		core.createNode = function(parent, base, relid) {
			ASSERT(isValidNode(parent));
			ASSERT(!base || isValidNode(base));
			ASSERT(typeof relid === "undefined" || typeof relid === "string");

			node = oldcore.createNode(parent, relid);
			if (!!base) {
				oldcore.setPointer(node, "base", base);
			}

			return node;
		};

		// ----- properties

		core.getAttributeNames = function(node) {
			ASSERT(isValidNode(node));

			var merged = {};
			do {
				var names = oldcore.getAttributeNames(node);
				for ( var i = 0; i < names.length; ++i) {
					if (!(names[i] in merged)) {
						merged[names[i]] = true;
					}
				}

				node = node.base;
			} while (node);

			return Object.keys(merged);
		};

		core.getRegistryNames = function(node) {
			ASSERT(isValidNode(node));

			var merged = {};
			do {
				var names = oldcore.getRegistryNames(node);
				for ( var i = 0; i < names.length; ++i) {
					if (!(names[i] in merged)) {
						merged[names[i]] = true;
					}
				}

				node = node.base;
			} while (node);

			return Object.keys(merged);
		};

		core.getAttribute = function(node, name) {
			ASSERT(isValidNode(node));

			do {
				value = oldcore.getAttribute(node, name);
				node = node.base;
			} while (typeof value === "undefined" && node !== null);

			return value;
		};

		core.getRegistry = function(node, name) {
			ASSERT(isValidNode(node));

			do {
				value = oldcore.getRegistry(node, name);
				node = node.base;
			} while (typeof value === "undefined" && node !== null);

			return value;
		};

		// ----- pointers

		core.getPointerNames = function(node) {
			ASSERT(isValidNode(node));

			var merged = {};
			do {
				var names = oldcore.getPointerNames(node);
				for ( var i = 0; i < names.length; ++i) {
					if (!(names[i] in merged)) {
						merged[names[i]] = true;
					}
				}

				node = node.base;
			} while (node);

			return Object.keys(merged);
		};

		core.getPointer = function(node, name) {
			ASSERT(isValidNode(node));

			do {
				value = oldcore.getPointer(node, name);
				node = node.base;
			} while (typeof value === "undefined" && node !== null);

			return value;
		};

		return core;
	};

	return CoreType;
});
