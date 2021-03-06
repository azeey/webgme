"use strict";

define(['css!/css/Loader/LoaderCircles'], function () {

    var LoaderCircles,
        CIRCLE_O_SHADOW_SIZE = 36,
        CIRCLE_BORDER_SIZE = 5,
        MIN_SIZE = 30,
        MAX_SIZE = 200,
        CIRCLE_I_SIZE_DIFF = 20;

    LoaderCircles = function (params) {

        this._el = params.containerElement;

        if (this._el.length === 0) {
            throw "LoaderCircles's container control with id:'" + params.containerElement + "' could not be found";
        }

        this._loaderBackgroundCssProps = {};
        this._loaderContentCssProps = {};
    };

    LoaderCircles.prototype._initialize = function () {
        this._createElements();
    };

    LoaderCircles.prototype._removeElements = function () {
        if (this._loaderContainer) {
            this._loaderContainer.remove();
        }
        this._loaderContainer = null;

        if (this._loaderBackground) {
            this._loaderBackground.remove();
        }
        this._loaderBackground = null;
    };

    LoaderCircles.prototype._createElements = function () {
        if (!this._loaderContainer) {
            this._loaderContainer = $('<div/>', { "class" : "loader-container" }).css(this._loaderContentCssProps);

            this._loaderBackground = $('<div/>', { "class" : "loader-bg" }).css(this._loaderBackgroundCssProps);

            this._circleOuter = $('<div/>', { "class" : "circle-o" });

            this._circleInner = $('<div/>', { "class" : "circle-i" });

            if (this._size) {
                this._circleOuter.css({"width": this._size,
                                       "height": this._size,
                                       "border-radius": this._size});

                this._circleInner.css({"width": this._size - CIRCLE_I_SIZE_DIFF,
                                       "height": this._size - CIRCLE_I_SIZE_DIFF,
                                       "border-radius": this._size - CIRCLE_I_SIZE_DIFF,
                                       "top": 0 - CIRCLE_O_SHADOW_SIZE/3 - this._size/2 - (this._size - CIRCLE_I_SIZE_DIFF)/2 - 2 * CIRCLE_BORDER_SIZE});

                this._loaderContainer.css({"width": this._size + CIRCLE_O_SHADOW_SIZE,
                                           "height": this._size + CIRCLE_O_SHADOW_SIZE,
                                           "margin-top": (this._size + CIRCLE_O_SHADOW_SIZE) / -2,
                                           "margin-left": (this._size + CIRCLE_O_SHADOW_SIZE) / -2});
            }

            this._loaderContainer.append(this._circleOuter).append(this._circleInner);

            this._el.append(this._loaderBackground).append(this._loaderContainer);

            //force reflow
            this._el.width();
        }
    };

    LoaderCircles.prototype.destroy = function () {
        this._removeElements();
    };

    LoaderCircles.prototype.stop = function () {
        this._removeElements();
    };

    LoaderCircles.prototype.start = function () {
        this._createElements();
    };

    LoaderCircles.prototype.foreGroundColor = function (color) {
        this._loaderContentCssProps["background-color"] = color;
    };

    LoaderCircles.prototype.setSize = function (size) {
        var pSize = parseInt(size, 10);

        if (pSize < MIN_SIZE) {
            this._size = MIN_SIZE;
        } else {
            if (pSize > MAX_SIZE) {
                this._size = MAX_SIZE;
            } else {
                this._size = pSize;
            }
        }
    };

    return LoaderCircles;
});
