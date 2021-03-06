/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Author: Tamas Kecskes
 */

define([], function () {
    "use strict";

    var NULLPTR_NAME = "_null_pointer";
    var NULLPTR_RELID = "_nullptr";


    function nullPointerCore (_innerCore) {

        //helper functions
        function updateDescriptorHash(node){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var dCount = _innerCore.getRegistry(node,'d_count') || 0;
            _innerCore.setRegistry(node,'d_count',dCount + 1);
        }
        var _core = {};
        for(var i in _innerCore){
            _core[i] = _innerCore[i]
        }


        //extra functions
        _core.setPointer = function(node,name, target){
            if(target === null){
                var nullChild = _innerCore.getChild(node,NULLPTR_RELID);
                _innerCore.setAttribute(nullChild,'name',NULLPTR_NAME);
                _innerCore.setPointer(node,name,nullChild);
            } else {
                _innerCore.setPointer(node,name,target);
            }
        };
        _core.getPointerPath = function(node,name){
            var path = _innerCore.getPointerPath(node,name);
            if(path && path.indexOf(NULLPTR_RELID) !== -1){
                return null;
            } else {
                return path;
            }
        };



        return _core;
    }

    return nullPointerCore;
});


