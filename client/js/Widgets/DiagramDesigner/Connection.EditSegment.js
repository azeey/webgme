/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * 
 * Author: Robert Kereskenyi
 */

"use strict";

define(['js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'raphaeljs'], function (DiagramDesignerWidgetConstants) {

    var ConnectionEditSegment,
        MIN_WIDTH = 5;

    ConnectionEditSegment = function (params) {
        this.id = params.id;
        this.connection = params.connection;
        this.points = params.points;
        this.svgPaper = this.connection.paper;
        this.path = undefined;

        this.width = Math.max(MIN_WIDTH, this.connection.designerAttributes.width);

        this._render();
    };

    ConnectionEditSegment.prototype.destroy = function () {
        if (this.path) {
            this.path.remove();
            this.path = undefined;
        }

        if (this.circle) {
            this.circle.remove();
            this.circle = undefined;
        }
    };

    ConnectionEditSegment.prototype._render = function () {
        var i,
            p = this.points,
            len = p.length,
            pathDef = [];

        for (i = 0; i < len; i += 1) {
            if (i === 0) {
                pathDef.push("M" + p[i][0] + "," + p[i][1]);
            } else {
                pathDef.push("L" + p[i][0] + "," + p[i][1]);
            }
        }

        this.pathDef = pathDef.join(" ");

        this.path = this.svgPaper.path(this.pathDef);

        this.path.attr({"stroke-width": this.width});

        this.path.node.setAttribute('class', DiagramDesignerWidgetConstants.PATH_EDIT_SEGMENT_CLASS);

        this._initMouseHandlers();
    };

    ConnectionEditSegment.prototype._initMouseHandlers = function () {
        var self = this;

        this.circle = this.svgPaper.circle(0, 0, this.width).hide();

        this.circle.node.setAttribute('class', DiagramDesignerWidgetConstants.PATH_EDIT_SEGMENT_NEW_SEGMENT_POINT_MARKER_CLASS);

        this.path.mouseover(function (event) {
            if (self.circle) {
                self.circle.show();
            }
            event.stopPropagation();
            event.preventDefault();
        });

        this.path.mouseout(function (event) {
            if (self.circle) {
                self.circle.hide();
            }
            event.stopPropagation();
            event.preventDefault();
        });

        this.path.mousemove(function (event) {
            var mousePos = self._getMousePos(event),
                pos = self._getSelectedPathPoint(mousePos.mX, mousePos.mY);

            if (pos) {
                self.circle.attr({ "cx": pos.x,
                    "cy": pos.y });
            }
            event.stopPropagation();
            event.preventDefault();
        });

        this.path.mousedown(function (event) {
            event.stopPropagation();
        });

        this.path.dblclick(function (event) {
            var mousePos = self._getMousePos(event),
                pos = self._getSelectedPathPoint(mousePos.mX, mousePos.mY);

            if (pos) {
                self.connection.addSegmentPoint(self.id, pos.x, pos.y);
            }

            event.stopPropagation();
            event.preventDefault();
        });
    };

    ConnectionEditSegment.prototype._getMousePos = function (e) {
        return this.connection.diagramDesigner.getAdjustedMousePos(e);
    };

    ConnectionEditSegment.prototype._getSelectedPathPoint = function (mouseX, mouseY) {
        var w = this.width + 2,
            horizontalPath = ["M", mouseX - w, mouseY, "L", mouseX + w, mouseY].join(","),
            verticalPath = ["M", mouseX, mouseY - w, "L", mouseX, mouseY + w].join(","),
            intersectionsHorizontal = Raphael.pathIntersection(this.pathDef, horizontalPath),
            intersectionsVertical = Raphael.pathIntersection(this.pathDef, verticalPath),
            distanceH = 1000,
            distanceW = 1000,
            resultPos;

        if (intersectionsHorizontal.length > 0) {
            distanceH = Math.abs(mouseX - intersectionsHorizontal[0].x) + Math.abs(mouseY - intersectionsHorizontal[0].y);
        }
        if (intersectionsVertical.length > 0) {
            distanceW = Math.abs(mouseX - intersectionsVertical[0].x) + Math.abs(mouseY - intersectionsVertical[0].y);
        }

        if (distanceH < distanceW) {
            if (intersectionsHorizontal.length > 0) {
                resultPos = {   "x": intersectionsHorizontal[0].x,
                    "y": intersectionsHorizontal[0].y,
                    "t": intersectionsHorizontal[0].t1,
                    "bez": intersectionsHorizontal[0].bez1 };
            }
        } else {
            if (intersectionsVertical.length > 0) {
                resultPos = {   "x": intersectionsVertical[0].x,
                    "y": intersectionsVertical[0].y,
                    "t": intersectionsVertical[0].t1,
                    "bez": intersectionsVertical[0].bez1 };
            }
        }

        return resultPos;
    };

    return ConnectionEditSegment;
});