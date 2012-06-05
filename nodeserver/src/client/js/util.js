"use strict";
/*
 * Utility helper functions for the client side
 */

define(['order!jquery.min',
        'order!jquery-ui.min'], function (jquery,
                                       jqueryUI) {

    /*
     * Disabling selection on element
     */
    $.fn.extend({
        disableSelection : function () {
            this.each(function () {
                this.onselectstart = function () { return false; };
                $(this).attr('unselectable', 'on');
                $(this).css('-moz-user-select', 'none');
                $(this).css('-webkit-user-select', 'none');
                $(this).css('user-select', 'none');
                $(this).css('-ms-user-select', 'none');
            });
        }
    });

    /*
     * Disabling selection on element
     */
    $.fn.extend({
        editInPlace : function (editClass, successCallback) {
            this.each(function () {
                var contentWidth = $(this).outerWidth(),
                    inputCtrl,
                    prevTitle = $(this).html(),
                    originalCtrl = $(this);

                originalCtrl.html("<input id='editNode' value='" + prevTitle + "' class='" + editClass + "' />");
                inputCtrl =  $(this).find("#editNode");
                inputCtrl.width(contentWidth - 18);
                inputCtrl.focus().keydown(
                    function (event) {
                        switch (event.which) {
                        case 27: // [esc]
                            // discard changes on [esc]
                            inputCtrl.val(prevTitle);
                            event.preventDefault();
                            $(this).blur();
                            break;
                        case 13: // [enter]
                            // simulate blur to accept new value
                            event.preventDefault();
                            $(this).blur();
                            break;
                        }
                    }
                ).blur(function (event) {
                    var newTitle = inputCtrl.val();
                    // Accept new value, when user leaves <input>

                    if (newTitle === "") {
                        newTitle = prevTitle;
                    }

                    originalCtrl.html(newTitle);
                    if (prevTitle !== newTitle) {
                        if (successCallback) {
                            successCallback(newTitle);
                        }
                    }
                });
            });
        }
    });

    /*
     *
     * Getting textwidth
     *
     */
    $.fn.textWidth = function () {
        var html_org, html_calc, width;

        html_org = $(this).html();
        html_calc = '<span>' + html_org + '</span>';
        $(this).html(html_calc);
        width = $(this).find('span:first').width();
        $(this).html(html_org);

        return width;
    };

    //return utility functions
    return {
        /*
         * Computes the difference between two arrays
         */
        arrayMinus : function (arrayA, arrayB) {
            var result = [], i, val;
            for (i = 0; i < arrayA.length; i += 1) {
                if (arrayA[i]) {
                    val = arrayA[i];
                    if (arrayB.indexOf(val) === -1) {
                        result.push(val);
                    }
                }
            }

            return result;
        },

        /*
         * Returns true if the two boundingbox overlap
         */
        overlap : function (boundingBoxA, boundingBoxB) {
            var result = false;

            if (boundingBoxA.x < boundingBoxB.x2 && boundingBoxA.x2 > boundingBoxB.x && boundingBoxA.y < boundingBoxB.y2 && boundingBoxA.y2 > boundingBoxB.y) {
                result = true;
            }

            return result;
        },

        /*
         * Returns true if the two position is inside the rectangle
         */
        isPositionInsideRectangle : function (position, boundingBox) {
            var result = false;

            if (boundingBox.x <= position.x && boundingBox.x2 >= position.x && boundingBox.y <= position.y && boundingBox.y2 >= position.y) {
                result = true;
            }

            return result;
        },

        /*
         * Loads a CSS file dinamically
         */
        loadCSS : function (filePath) {
            var css	= document.createElement('link');
            css.rel		= 'stylesheet';
            css.type	= 'text/css';
            css.media	= 'all';
            css.href	= filePath;
            document.getElementsByTagName("head")[0].appendChild(css);
        }
    };
});