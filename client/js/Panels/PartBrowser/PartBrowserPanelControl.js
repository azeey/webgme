"use strict";

define(['logManager',
    'clientUtil',
    'js/Constants',
    'js/NodePropertyNames'], function (logManager,
                             util,
                             CONSTANTS,
                             nodePropertyNames) {

    var PartBrowserControl,
        WIDGET_NAME = 'PartBrowser',
        DEFAULT_DECORATOR = "DefaultDecorator";

    PartBrowserControl = function (myClient, myPartBrowserView) {
        this._client = myClient;
        this._partBrowserView = myPartBrowserView;

        this._currentNodeId = null;
        this._currentNodeParts = [];
        this._componentIDPartIDMap = {};

        this._logger = logManager.create("PartBrowserControl");
        this._logger.debug("Created");
    };

    PartBrowserControl.prototype.selectedObjectChanged = function (nodeId) {
        this._logger.debug("SELECTEDOBJECT_CHANGED nodeId '" + nodeId + "'");

        //remove current territory patterns
        if (this._currentNodeId) {
            this._client.removeUI(this._territoryId);
            this._partBrowserView.clear();
        }

        this._currentNodeId = nodeId;
        this._currentNodeParts = [];
        this._componentIDPartIDMap = {};
        this._currentNodePartsCanCreateChild = {};

        if (this._currentNodeId) {
            //put new node's info into territory rules
            this._selfPatterns = {};
            this._selfPatterns[nodeId] = { "children": 0 };

            this._territoryId = this._client.addUI(this, true);
            //update the territory
            this._client.updateTerritory(this._territoryId, this._selfPatterns);
        }
    };

    PartBrowserControl.prototype._getObjectDescriptor = function (nodeId) {
        var nodeObj = this._client.getNode(nodeId),
            objDescriptor;

        if (nodeObj) {
            objDescriptor = {};

            objDescriptor.id = nodeObj.getId();
            objDescriptor.decorator = nodeObj.getRegistry(nodePropertyNames.Registry.decorator) || DEFAULT_DECORATOR;
        }

        return objDescriptor;
    };

    PartBrowserControl.prototype.onOneEvent = function (events) {
        var i = events ? events.length : 0,
            e;

        this._logger.debug("onOneEvent '" + i + "' items, events: " + JSON.stringify(events));

        this._updatePackage = {'inserted': [],
                               'updated': [],
                               'decorators': [DEFAULT_DECORATOR]};

        this._notifyPackage = {};

        while (i--) {
            e = events[i];
            switch (e.etype) {
                case CONSTANTS.TERRITORY_EVENT_LOAD:
                    this._onLoad(e.eid);
                    break;
                case CONSTANTS.TERRITORY_EVENT_UPDATE:
                    this._onUpdate(e.eid);
                    break;
                case CONSTANTS.TERRITORY_EVENT_UNLOAD:
                    this._onUnload(e.eid);
                    break;
            }
        }

        this._handleUpdatePackageDecorators(this._updatePackage);

        this._handleDecoratorNotification(this._notifyPackage);

        this._logger.debug("onOneEvent '" + events.length + "' items - DONE");
    };

    // PUBLIC METHODS
    PartBrowserControl.prototype._onLoad = function (gmeID) {
        var decorator;

        if (this._currentNodeId === gmeID) {
            this._processPartsOwnerNode(gmeID);
        } else if (this._currentNodeParts.indexOf(gmeID) !== -1) {
            //part item got loaded
            this._updatePackage.inserted.push(gmeID);

            decorator = this._getObjectDescriptor(gmeID).decorator;
            if (this._updatePackage.decorators.indexOf(decorator) === -1) {
                this._updatePackage.decorators.push(decorator);
            }
        }

        this._buildNotifyPackageByID(gmeID);

        this._updatePartDraggability();
    };

    PartBrowserControl.prototype._onUpdate = function (gmeID) {
        var decorator;

        if (this._currentNodeId === gmeID) {
            this._processPartsOwnerNode(gmeID);
        } else if (this._currentNodeParts.indexOf(gmeID) !== -1) {
            //part item got updated
            this._updatePackage.updated.push(gmeID);

            decorator = this._getObjectDescriptor(gmeID).decorator;
            if (this._updatePackage.decorators.indexOf(decorator) === -1) {
                this._updatePackage.decorators.push(decorator);
            }
        }

        this._buildNotifyPackageByID(gmeID);

        this._updatePartDraggability();
    };

    PartBrowserControl.prototype._onUnload = function (gmeID) {
        if (this._currentNodeId === gmeID) {

        }

        this._notifyPartsByID(gmeID);
    };

    PartBrowserControl.prototype._processPartsOwnerNode = function (gmeID) {
        var node = this._client.getNode(gmeID),
            currentMembers = [],
            oldMembers = this._currentNodeParts.slice(0),
            containmentMetaDescriptor = node.getChildrenMetaDescriptor() || [],
            len,
            diff,
            idx,
            id,
            diffInserted,
            self = this,
            territoryChanged = false;

        if (node) {
            //get possible targets from MetaDescriptor
            len = containmentMetaDescriptor.length;
            while(len--) {
                currentMembers.push(containmentMetaDescriptor[len].target);
            }

            //check the deleted ones
            diff = _.difference(oldMembers, currentMembers);
            len = diff.length;
            while (len--) {
                id = diff[len];
                this._partBrowserView.removePart(id);

                idx = this._currentNodeParts.indexOf(id);
                this._currentNodeParts.splice(idx, 1);

                delete this._currentNodePartsCanCreateChild[id];

                //remove it from the territory
                delete this._selfPatterns[id];

                this._logger.debug('Removing id "' + id + '" from territory...');

                territoryChanged = true;
            }

            //check the added ones
            diffInserted = _.difference(currentMembers, oldMembers);
            len = diffInserted.length;
            while (len--) {
                id = diffInserted[len];
                this._currentNodeParts.push(id);

                this._logger.debug('Adding id "' + id + '" to territory...');

                //add to the territory
                this._selfPatterns[id] = { "children": 0 };
                territoryChanged = true;
            }

            //update create child capability info
            len = this._currentNodeParts.length;
            while (len--) {
                this._currentNodePartsCanCreateChild[this._currentNodeParts[len]] = this._client.canCreateChild({'parentId': gmeID,
                                                                                                                 'objectId': this._currentNodeParts[len]});
            }

            //update the territory
            if (territoryChanged) {
                //TODO: review this async here
                setTimeout(function () {
                    self._logger.debug('Updating territory with ruleset: ' + JSON.stringify(self._selfPatterns));
                    self._client.updateTerritory(self._territoryId, self._selfPatterns);
                }, 10);
            }
        }
    };


    PartBrowserControl.prototype._handleUpdatePackageDecorators = function (updatePackage) {
        var self = this;

        if (updatePackage.decorators.length > 0) {
            this._client.decoratorManager.download(updatePackage.decorators, WIDGET_NAME, function () {
                self._decoratorsDownloaded(updatePackage);
            });
        }
    };


    PartBrowserControl.prototype._getItemDecorator = function (decorator) {
        var result;

        result = this._client.decoratorManager.getDecoratorForWidget(decorator, WIDGET_NAME);
        if (!result) {
            result = this._client.decoratorManager.getDecoratorForWidget(DEFAULT_DECORATOR, WIDGET_NAME);
        }

        return result;
    };


    PartBrowserControl.prototype._decoratorsDownloaded = function (updatePackage) {
        var i,
            id,
            decoratorInstance,
            getDecoratorTerritoryQueries,
            territoryChanged = false,
            self = this;

        this._logger.debug('_decoratorsDownloaded: ' + updatePackage.inserted + ', ' + updatePackage.updated + ', ' + updatePackage.decorators);

        getDecoratorTerritoryQueries = function (decorator) {
            var query,
                entry;

            if (decorator) {
                query = decorator.getTerritoryQuery();

                if (query) {
                    for (entry in query) {
                        if (query.hasOwnProperty(entry)) {
                            self._selfPatterns[entry] = query[entry];
                            territoryChanged = true;
                        }
                    }
                }
            }
        };

        //handle inserted
        i = updatePackage.inserted.length;
        while (i--) {
            id = updatePackage.inserted[i];

            if (this._currentNodeParts.indexOf(id) !== -1) {
                decoratorInstance = this._partBrowserView.addPart(id, this._getPartDescriptor(id));
                getDecoratorTerritoryQueries(decoratorInstance);
            } else {
                //this should not happen at all
                this._logger.debug('_decoratorsDownloaded updatePackage.inserted contains id "' + id + '" that is not part of the current object "' + this._currentNodeId + '"');
            }
        }

        //handle updated
        i = updatePackage.updated.length;
        while (i--) {
            id = updatePackage.updated[i];

            if (this._currentNodeParts.indexOf(id) !== -1) {
                decoratorInstance = this._partBrowserView.updatePart(id, this._getPartDescriptor(id));
                getDecoratorTerritoryQueries(decoratorInstance);
            } else {
                //this should not happen at all
                this._logger.debug('_decoratorsDownloaded updatePackage.updated contains id "' + id + '" that is not part of the current object "' + this._currentNodeId + '"');
            }
        }

        this._updatePartDraggability();

        //update the territory
        if (territoryChanged) {
            //TODO: review this async here
            setTimeout(function () {
                self._logger.debug('Updating territory with ruleset from decorators: ' + JSON.stringify(self._selfPatterns));
                self._client.updateTerritory(self._territoryId, self._selfPatterns);
            }, 10);
        }
    };

    PartBrowserControl.prototype._getPartDescriptor = function (id) {
        var desc = this._getObjectDescriptor(id);

        desc.decoratorClass = this._getItemDecorator(desc.decorator);
        desc.control = this;
        desc.metaInfo = {};
        desc.metaInfo[CONSTANTS.GME_ID] = id;

        return desc;
    };

    PartBrowserControl.prototype.registerComponentIDForPartID = function (componentID, partId) {
        this._componentIDPartIDMap[componentID] = this._componentIDPartIDMap[componentID] || [];
        this._componentIDPartIDMap[componentID].push(partId);
    };

    PartBrowserControl.prototype.unregisterComponentIDFromPartID = function (componentID, partId) {
        var idx;

        if (this._componentIDPartIDMap && this._componentIDPartIDMap[componentID]) {
           idx = this._componentIDPartIDMap[componentID].indexOf(partId);
            if (idx !== -1) {
                this._componentIDPartIDMap[componentID].splice(idx, 1);
            }
        }
    };

    PartBrowserControl.prototype._buildNotifyPackageByID = function (gmeID) {
        var len;
        if (this._componentIDPartIDMap && this._componentIDPartIDMap[gmeID]) {
            len = this._componentIDPartIDMap[gmeID].length;
            while (len--) {
                this._notifyPackage[this._componentIDPartIDMap[gmeID][len]] = this._notifyPackage[this._componentIDPartIDMap[gmeID][len]] || [];
                this._notifyPackage[this._componentIDPartIDMap[gmeID][len]].push(gmeID);
            }
        }
    };

    PartBrowserControl.prototype._handleDecoratorNotification = function (notifyPackage) {
        var partId;
        if (notifyPackage) {
            for (partId in notifyPackage) {
                if (notifyPackage.hasOwnProperty(partId)) {
                    this._logger.debug('NotifyPartDecorator: ' + partId + ', GME_IDs: ' + notifyPackage[partId]);
                    this._partBrowserView.notifyPart(partId, notifyPackage[partId]);
                }
            }
        }
    };

    PartBrowserControl.prototype._updatePartDraggability = function () {
        var len = this._currentNodeParts.length;
        while (len--) {
            this._partBrowserView.setEnabled(this._currentNodeParts[len], this._currentNodePartsCanCreateChild[this._currentNodeParts[len]]);
        }
    };

    return PartBrowserControl;
});