"use strict";

define([], function () {

    var DiagramDesignerWidgetSubcomponents;

    DiagramDesignerWidgetSubcomponents = function () {
    };

    DiagramDesignerWidgetSubcomponents.prototype.registerSubcomponent = function (objID, sCompID, metaInfo) {
        //store that a subcomponent with a given ID has been added to object with objID
        this._itemSubcomponentsMap[objID] = this._itemSubcomponentsMap[objID] || [];
        this._itemSubcomponentsMap[objID].push(sCompID);

        this.onRegisterSubcomponent(objID, sCompID, metaInfo);
    };

    DiagramDesignerWidgetSubcomponents.prototype.unregisterSubcomponent = function (objID, sCompID) {
        var idx;

        //if there is connection draw or redraw, let the connection manager know about the deletion
        if (this.mode === this.OPERATING_MODES.CREATE_CONNECTION ||
            this.mode === this.OPERATING_MODES.RECONNECT_CONNECTION) {
            this.connectionDrawingManager.componentDelete(objID, sCompID);
        }

        //store that a subcomponent with a given ID has been removed from object with objID
        idx = this._itemSubcomponentsMap[objID].indexOf(sCompID);
        if (idx !== -1) {
            this._itemSubcomponentsMap[objID].splice(idx,1);
        }

        this.onUnregisterSubcomponent(objID, sCompID);
    };

    return DiagramDesignerWidgetSubcomponents;
});