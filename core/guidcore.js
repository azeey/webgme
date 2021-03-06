/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Author: Tamas Kecskes
 */

define([ "util/assert", "util/guid" ], function (ASSERT, GUID) {
	"use strict";

	var GUID_REGEXP = new RegExp("[a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12}", 'i');

	function guidCore (_innerCore) {

		//helper functions
		function toInternalGuid (myGuid) {
			return myGuid.replace(/-/g, "");
		}

		function toExternalGuid (myGuid) {
			var out = myGuid.substr(0, 8) + '-' + myGuid.substr(8, 4) + '-' + myGuid.substr(12, 4) + '-' + myGuid.substr(16, 4) + '-' + myGuid.substr(20);
			return out;
		}

		function guidToArray (guid) {
			var array = [];
			for ( var i = 0; i < guid.length / 4; i++) {
				array.push(parseInt(guid.substr(4 * i, 4), 16));
			}
			return array;
		}

		function xorGuids (a, b) {
			var arrayA = guidToArray(a);
			var arrayB = guidToArray(b);

			ASSERT(arrayA.length === arrayB.length);

			var arrayOut = [];
			for ( var i = 0; i < arrayA.length; i++) {
				arrayOut.push(arrayA[i] ^ arrayB[i]);
			}
			for (i = 0; i < arrayOut.length; i++) {
				arrayOut[i] = Number(arrayOut[i]).toString(16);
				var difi = 4 - arrayOut[i].length;
				while (difi > 0) {
					arrayOut[i] = '0' + arrayOut[i];
					difi--;
				}
			}
			return arrayOut.join("");
		}

		var _core = {};
		for ( var i in _innerCore) {
			_core[i] = _innerCore[i];
		}

		//new functions
		_core.getGuid = function (node) {
			var outGuid = _core.getAttribute(node, "_relguid");
			var tempnode = _core.getParent(node);
			while (tempnode) {
				outGuid = xorGuids(outGuid, _core.getAttribute(tempnode, "_relguid"));
				tempnode = _core.getParent(tempnode);
			}
			return toExternalGuid(outGuid);
		};

		_core.setGuid = function (node, guid, callback) {
			ASSERT(GUID_REGEXP.test(guid));
			_core.loadChildren(node, function (err, children) {
				if (err) {
					callback(err);
				} else {
					var newguid = toInternalGuid(guid);
					for ( var i = 0; i < children.length; i++) {
						var oldguid = toInternalGuid(_core.getGuid(children[i]));
						_core.setAttribute(children[i], "_relguid", xorGuids(newguid, oldguid));
					}
					var parent = _core.getParent(node);
					if (parent) {
						_core.setAttribute(node, "_relguid", xorGuids(newguid, toInternalGuid(_core.getGuid(parent))));
					} else {
						_core.setAttribute(node, "_relguid", newguid);
					}
					callback(null);
				}
			});
		};

		//modified functions
		_core.createNode = function (parent, relid, guid) {
			ASSERT(guid === null || guid === undefined || GUID_REGEXP.test(guid));

			var node = _innerCore.createNode(parent, relid);
			guid = guid || GUID();
			guid = toInternalGuid(guid);

			var relguid = "";
			if (parent) {
				relguid = xorGuids(toInternalGuid(_core.getGuid(_core.getParent(node))), guid);
			} else {
				relguid = guid;
			}
			_innerCore.setAttribute(node, "_relguid", relguid);

			return node;
		};

		_core.moveNode = function (node, parent) {
			var newnode = _innerCore.moveNode(node, parent);
			var newguid = toInternalGuid(_core.getGuid(_core.getParent(newnode)));
			newguid = xorGuids(toInternalGuid(_core.getGuid(newnode)), newguid);
			_core.setAttribute(newnode, "_relguid", newguid);

			return newnode;
		};

		_core.copyNode = function (node, parent) {
			var newnode = _innerCore.copyNode(node, parent);
			_core.setAttribute(newnode, "_relguid", toInternalGuid(GUID()));

			return newnode;
		};

		_core.getAttributeNames = function (node) {
			var names = _innerCore.getAttributeNames(node);
            //TODO: double check (theoretically no need to try to filter out)
			//names.splice(names.indexOf("_relguid"), 1);
			return names;
		};

		return _core;
	}

	return guidCore;
});
