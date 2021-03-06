"use strict";

define(['logManager',
        'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants'], function (logManager,
                                                                                 DiagramDesignerWidgetConstants) {

    var Port,
        PORT_CONNECTOR_LEN = 20,
        PORT_DOM_HEIGHT = 20;

    Port = function (id, options) {
        this.id = id;

        this.title = options.title || "";
        this.orientation = undefined;
        this.position = {};
        this.skinParts = [];
        this.connectionArea = { "x1": 0,
            "y1": 0,
            "x2": 0,
            "y2": 0,
            "angle1": 0,
            "angle2": 0,
            "len": PORT_CONNECTOR_LEN};

        this.decorator = options.decorator;

        //get logger instance for this component
        //some comment here
        this.logger = logManager.create("Port_" + this.id);
        this.logger.debug("Created");
    };

    Port.prototype._DOMPortBase = $('<div  id="__ID__" class="port" data-id="__ID__"></div>');
    Port.prototype._DOMTitleWrapper = $('<div class="title-wrapper"><span class="title">__NAME__</span></div>');
    Port.prototype._DOMDot = $('<span class="dot"></span>');
    Port.prototype._DOMConnector = $('<div class="connector"></div>');

    Port.prototype._DOMBaseLeftTemplate = Port.prototype._DOMPortBase.clone().append(Port.prototype._DOMDot.clone()).append(Port.prototype._DOMConnector.clone()).append(Port.prototype._DOMTitleWrapper.clone());

    Port.prototype._DOMBaseRightTemplate = Port.prototype._DOMPortBase.clone().append(Port.prototype._DOMTitleWrapper.clone()).append(Port.prototype._DOMDot.clone()).append(Port.prototype._DOMConnector.clone());

    Port.prototype._initialize = function () {
        var concretePortTemplate = this.orientation === "W" ? this._DOMBaseLeftTemplate : this._DOMBaseRightTemplate;

        this.$el = concretePortTemplate.clone();
        this.$el.attr({"id": this.id,
                      "data-id": this.id,
                      "title": this.title});

        this.$portTitle = this.$el.find(".title");
        this.$portTitle.text(this.title);

        this.$connectors = this.$el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS);

        this.$portDot = this.$el.find(".dot");

        if (this.decorator._displayConnectors === true) {
            if (this.decorator.hostDesignerItem) {
                this.decorator.hostDesignerItem.registerConnectors(this.$connectors, this.id);
            }
            this.hideConnectors();
        } else {
            this.$connectors.remove();
        }
    };

    Port.prototype.update = function (options) {
        if (options.title) {
            if (this.title !== options.title) {
                this.title = options.title;
                this.$portTitle.text(this.title);
                this.$el.attr({"title": this.title});
            }
        }
    };

    Port.prototype.updateOrPos = function (or, pos) {
        var changed = false;

        if (this.position.x !== pos.x) {
            this.position.x = pos.x;
            changed = true;
        }

        if (this.position.y !== pos.y) {
            this.position.y = pos.y;
            changed = true;
        }


        if (this.orientation !== or) {
            this.orientation = or;
            changed = true;

            if (!this.$el) {
                this._initialize();
            } else {
                //port's DOM has to be reformatted

                //detach elements and re-append them in a different place
                this.$connectors.detach();
                this.$portDot.detach();

                if (this.orientation === "E") {
                    //now it has EAST orientation
                    this.$el.append(this.$portDot).append(this.$connectors);
                } else {
                    //now it has WEST orientation
                    this.$el.prepend(this.$connectors).prepend(this.$portDot);
                }

                if (this.decorator._displayConnectors !== true) {
                    this.$connectors.remove();
                }
            }
        }

        return changed;
    };

    Port.prototype.destroy = function () {
        this.hideConnectors();
        //finally remove itself from DOM
        if (this.$el) {
            this.$el.remove();
            this.$el.empty();
        }
    };

    //Shows the 'connectors' - appends them to the DOM
    Port.prototype.showConnectors = function () {
        this.$connectors.show();
    };

    //Hides the 'connectors' - detaches them from the DOM
    Port.prototype.hideConnectors = function () {
        this.$connectors.hide();
    };


    Port.prototype.getConnectorArea = function () {
        var allPorts = this.$el.parent().children(),
            len = allPorts.length,
            i;

        for (i = 0; i < len; i += 1) {
            if (allPorts[i] === this.$el[0]) {
                break;
            }
        }

        this.connectionArea.x1 = this.orientation === "W" ? 0 : this.decorator.hostDesignerItem.width;
        this.connectionArea.x2 = this.connectionArea.x1;
        this.connectionArea.y1 = i * PORT_DOM_HEIGHT + 6;
        this.connectionArea.y2 = this.connectionArea.y1 + 7;
        this.connectionArea.angle1 = this.orientation === "W" ? 180 : 0;
        this.connectionArea.angle2 = this.orientation === "W" ? 180 : 0;

        return this.connectionArea;
    };

    return Port;
});