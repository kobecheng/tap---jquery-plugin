// Generated by CoffeeScript 1.6.1
/*

Zonda Base64.coffee (c) Degas
https://github.com/smallsmallwolf/Zonda

jQuery port (c) 2010 Carlo Zottmann
http://github.com/carlo/jquery-base64

Original code (c) 2010 Nick Galbreath
http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
define("/assets/vendor/Zonda/util/base64/base64-debug", [ "underscore-debug" ], function(require, exports, module) {
    var JSON_stringify, _, _ALPHA, _PADCHAR, _decode, _encode, _getbyte, _getbyte64;
    _ = require("underscore-debug");
    _PADCHAR = "=";
    _ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    JSON_stringify = function(string) {
        var json;
        json = JSON.stringify(string);
        return json.replace(/[\u007f-\uffff]/g, function(c) {
            return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
        });
    };
    _getbyte64 = function(s, i) {
        var idx;
        idx = _ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw "Cannot decode base64";
        }
        return idx;
    };
    _decode = function(s) {
        var b10, i, imax, pads, x, _i;
        pads = 0;
        imax = s.length;
        x = [];
        s = String(s);
        if (imax === 0) {
            return s;
        }
        if (imax % 4 !== 0) {
            throw "Cannot decode base64";
        }
        if (s.charAt(imax - 1) === _PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === _PADCHAR) {
                pads = 2;
            }
            imax -= 4;
        }
        for (i = _i = 0; _i < imax; i = _i += 4) {
            b10 = _getbyte64(s, i) << 18 | _getbyte64(s, i + 1) << 12 | _getbyte64(s, i + 2) << 6 | _getbyte64(s, i + 3);
            x.push(String.fromCharCode(b10 >> 16, b10 >> 8 & 255, b10 & 255));
        }
        switch (pads) {
          case 1:
            b10 = _getbyte64(s, i) << 18 | _getbyte64(s, i + 1) << 12 | _getbyte64(s, i + 2) << 6;
            x.push(String.fromCharCode(b10 >> 16, b10 >> 8 & 255));
            break;

          case 2:
            b10 = _getbyte64(s, i) << 18 | _getbyte64(s, i + 1) << 12;
            x.push(String.fromCharCode(b10 >> 16));
        }
        return x.join("");
    };
    _getbyte = function(s, i) {
        var x;
        x = s.charCodeAt(i);
        if (x > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }
        return x;
    };
    _encode = function(s) {
        var b10, i, imax, x, _i;
        if (arguments.length !== 1) {
            throw "SyntaxError: exactly one argument required";
        }
        s = String(s);
        x = [];
        imax = s.length - s.length % 3;
        if (s.length === 0) {
            return s;
        }
        for (i = _i = 0; _i < imax; i = _i += 3) {
            b10 = _getbyte(s, i) << 16 | _getbyte(s, i + 1) << 8 | _getbyte(s, i + 2);
            x.push(_ALPHA.charAt(b10 >> 18));
            x.push(_ALPHA.charAt(b10 >> 12 & 63));
            x.push(_ALPHA.charAt(b10 >> 6 & 63));
            x.push(_ALPHA.charAt(b10 & 63));
        }
        switch (s.length - imax) {
          case 1:
            b10 = _getbyte(s, i) << 16;
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt(b10 >> 12 & 63) + _PADCHAR + _PADCHAR);
            break;

          case 2:
            b10 = _getbyte(s, i) << 16 | _getbyte(s, i + 1) << 8;
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt(b10 >> 12 & 63) + _ALPHA.charAt(b10 >> 6 & 63) + _PADCHAR);
        }
        return x.join("");
    };
    return module.exports = {
        decode: function(s) {
            s = _decode(s);
            return JSON.parse(s);
        },
        encode: function(s) {
            s = JSON_stringify(s);
            return _encode(s);
        }
    };
});

// Generated by CoffeeScript 1.6.1
define("/assets/vendor/Zonda/util/dialog/dialog-debug", [ "bootstrap-debug", "underscore-debug", "mustache-debug" ], function(require, exports, module) {
    var $, Mustache, dialog, prefix, tpl, _;
    $ = require("bootstrap-debug");
    _ = require("underscore-debug");
    Mustache = require("mustache-debug");
    tpl = '<div id="zonda-util-dialog" class="modal fade hide" tabindex="-1" role="dialog" aria-hidden="true">\n<div class="modal-header">\n<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\n<h3>{{title}}</h3>\n</div>\n<div class="modal-body">\n{{content}}\n</div>\n<div class="modal-footer">\n<button class="btn" data-dismiss="modal" aria-hidden="true">取消</button>\n</div>\n</div>';
    prefix = "zonda-util";
    dialog = function(config) {
        var dialog_html;
        dialog.config = config;
        if ($("#" + prefix + "-dialog:visible")[0]) {
            return false;
        }
        dialog_html = Mustache.render(tpl, {
            title: config.title,
            content: config.content
        });
        $(document.body).append(dialog_html);
        if (config.css) {
            $("#" + prefix + "-dialog").css(config.css);
        }
        _.each(config.button, function(button_callback, button_name) {
            var uid;
            uid = _.uniqueId("" + prefix + "-dialog-button-");
            $("#" + prefix + "-dialog .modal-footer").append('<button id="' + uid + '" class="btn btn-success">\n  ' + button_name + "\n</button>");
            return $("#" + uid).click(button_callback);
        });
        dialog.dom = $("#" + prefix + "-dialog");
        $("#" + prefix + "-dialog").on("hide", function() {
            delete $("#" + prefix + "-dialog").modal;
            return $("#" + prefix + "-dialog").remove();
        });
        return dialog;
    };
    dialog.open = function() {
        var outerHeight;
        $("#" + prefix + "-dialog .modal-body").css({
            "max-height": window.innerHeight - 141
        });
        outerHeight = $("#" + prefix + "-dialog").outerHeight();
        $("#" + prefix + "-dialog").css({
            "margin-top": -outerHeight / 2
        });
        $("#" + prefix + "-dialog").modal({
            show: true,
            backdrop: dialog.config.backdrop
        });
        return dialog;
    };
    dialog.close = function(delay) {
        if (delay) {
            setTimeout(function() {
                return $("#" + prefix + "-dialog").modal("hide");
            }, delay);
        } else {
            $("#" + prefix + "-dialog").modal("hide");
        }
        return dialog;
    };
    return module.exports = dialog;
});

// Generated by CoffeeScript 1.6.1
define("/assets/vendor/Zonda/util/StateMachine/StateMachine-debug", [ "underscore-debug", "backbone-debug" ], function(require, exports, module) {
    var Backbone, StateMachine, _;
    _ = require("underscore-debug");
    Backbone = require("backbone-debug");
    StateMachine = function() {};
    _.extend(StateMachine.prototype, Backbone.Events);
    StateMachine.prototype.add = function(view) {
        var _this = this;
        this.on("change", function(curr) {
            if (curr === view) {
                return view.activate();
            } else {
                return view.deactivate();
            }
        }, this);
        return view.active = function() {
            return _this.trigger("change", view);
        };
    };
    return module.exports = StateMachine;
});

/**
 * slide.js
 * 幻灯片模块
 *
 * init: 方法，初始化slide实例，若需要page，则生成page，配置完毕后，须执行初始化init
 *
 * play: 方法，自动播放幻灯片
 * pause: 方法，停止播放幻灯片
 *
 * next: 方法，下一个
 * prev: 方法，上一个
 *
 * 配置参数如下：
 * slideDOM: DOM，必须参数，除此之外的配置参数为可选，
 *           作为slide的<ul>，该<ul>下的所有<li>将作为幻灯片播放
 *
 * slideLength: Number，幻灯片数目
 *
 * speed: Number，毫秒数，切换的速度
 *
 * pageDOM: DOM，将作为slide的页码的<ul>，
 *          模块会根据slideDOM的<ul>中的<li>的数量自动生成Page<li>插入到pageDOM中
 *
 * pageNum: true/false，是否在page上显示页码数字
 *
 * pageThumb : true/false, 是否在page上显示幻灯片缩略图
 *
 * animation: String，动画方式
 *
 * cutover : true/false，是否在page中加上“上一个”和“下一个”按钮
 *
 * ******************************************************************************
 * 代码示例
 *
 * var slide = require('path/slide.module');
 *
 * 配置
 * slide.config = {
 *  slideDOM : document.getElementById('slider'),
 *  pageDOM  : document.getElementById('page'),
 *  speed    : 1200,
 *  ...
 * }
 *
 * 配置完毕，初始化
 * slide.init();
 *
 * 绑定事件
 * $("#play").click( function() {
 *  slide.play();
 * });
 *
 * ******************************************************************************
 *
 * 如果在页面上有多个slide，则使用下面的方法获得多个slide实例
 * seajs.use( 'path/slide.module', function ( slide ) {
 *
 *  slide.config = {
 *      ...
 *  };
 *
 *  slide.init();
 *
 *  ...
 *
 * });
 *
 */
define("/assets/vendor/Zonda/util/slide/slide-debug", [ "underscore-debug", "easing-debug" ], function(require, exports, module) {
    var _ = require("underscore-debug");
    var $ = require("easing-debug");
    // 配置,初始置为空
    exports.config = {};
    // 必须的参数
    var need = {
        slideDOM: ""
    };
    // 默认配置 / 模块内部缓存配置
    var _config = {
        speed: 2e3,
        pageDOM: null,
        pageNum: false,
        pageThumb: false,
        animation: "fade",
        cutover: false
    };
    /**
     * 检查配置，并重写配置
     */
    var checkConfig = function() {
        // 当配置改变时，重新检查配置
        if (_.isEqual(_config, exports.config)) {
            return false;
        } else {
            // 将当前配置与默认/缓存配置合并
            _.extend(_config, exports.config);
            // 将合并的配置保存到当前配置中
            exports.config = _config;
        }
        // 检查是否包含必须的配置项
        try {
            _.each(need, function(em, key) {
                if (!_.has(exports.config, key)) {
                    throw new Error("Slide模块未配置" + key);
                }
            });
        } catch (e) {
            if (window.console !== undefined) {
                console.error(e.message);
            } else {
                alert(e.message);
            }
        }
    };
    // END checkConfig
    // 是否停止自动播放
    var autoPlay = true;
    // 计时器
    var timer;
    // 当前页码
    var onPage = -1;
    // 缓存幻灯片以及幻灯片页码的jQuery对象
    var slideArr;
    var pageArr;
    // Play 方法
    exports.play = function(page) {
        // 计数器置空
        clearTimeout(timer);
        // 传入了page参数，则跳到page指定的幻灯片
        if (page !== undefined) {
            // 将当前页码置为传入的page
            onPage = Math.abs(page);
            // 显示幻灯片
            // 根据选择的效果不同，采用不同的方式渲染
            // 淡入淡出 fade
            if (exports.config.animation === "fade") {
                slideArr.fadeOut("slow");
                slideArr.eq(onPage).stop().fadeIn("slow");
            } else if (exports.config.animation === "callBackFade") {
                slideArr.fadeOut("fast", function() {
                    slideArr.eq(onPage).fadeIn("fast");
                });
            } else if (exports.config.animation === "slip") {
                slideArr.eq(onPage - 1).stop().animate({
                    left: "-=960px",
                    opacity: "0"
                }, 500);
                slideArr.eq(onPage).css({
                    left: "960px",
                    opacity: "0"
                });
                slideArr.eq(onPage).stop().animate({
                    left: "-=960px",
                    opacity: "100"
                }, 1500);
            } else {
                slideArr.hide();
                slideArr.eq(onPage).show();
            }
            if (pageArr) {
                // 当前页码加亮
                pageArr.removeClass("on");
                pageArr.eq(onPage).addClass("on");
            }
        } else {
            // 幻灯片播放到最后一张时，跳至第一张
            if (onPage === exports.slideLength - 1) {
                exports.play(0);
            } else {
                // 播放下一张
                onPage = onPage + 1;
                exports.play(onPage);
            }
            // 不执函数体末尾的延时递归
            return false;
        }
        // 如果当前幻灯片为开头或末尾，则“next”和“prev”按钮加上class
        if (onPage === 0 && exports.config.cutover) {
            $(exports.config.pageDOM).find(".prev").addClass("beginning");
            $(exports.config.pageDOM).find(".next").removeClass("end");
        } else if (onPage === exports.slideLength - 1 && exports.config.cutover) {
            $(exports.config.pageDOM).find(".next").addClass("end");
            $(exports.config.pageDOM).find(".prev").removeClass("beginning");
        } else {
            $(exports.config.pageDOM).find(".prev").removeClass("beginning");
            $(exports.config.pageDOM).find(".next").removeClass("end");
        }
        // 自动播放，切换速度按照配置执行
        if (autoPlay) {
            timer = setTimeout(function() {
                exports.play();
            }, exports.config.speed);
        }
    };
    // END play
    // stop 方法
    exports.stop = function() {
        autoPlay = false;
        // 停止回调play方法
        clearTimeout(timer);
    };
    // END stop
    // pause 方法
    // 防止在较短的时间内多次调用
    exports.pause = function() {
        if (autoPlay) {
            autoPlay = false;
            // 停止回调play方法
            clearTimeout(timer);
        } else {
            autoPlay = true;
            exports.play();
        }
    };
    // END pause
    // Next 方法
    exports.next = function() {
        // 当前显示的幻灯片不为最后一张时，onPage加1
        if (onPage !== exports.slideLength - 1) {
            onPage = onPage + 1;
        }
        exports.play(onPage);
    };
    // END next
    // Prev 方法
    exports.prev = function() {
        // 不为第一张时，onPage减1
        if (onPage !== 0) {
            onPage = onPage - 1;
        }
        exports.play(onPage);
    };
    // END prev
    /**
     * init 方法
     * 初始化slide
     */
    exports.init = function() {
        // 检查配置
        checkConfig();
        // 将幻灯片个数缓存到模块配置中
        exports.slideLength = $(exports.config.slideDOM).find(">li").size();
        // 缓存单张幻灯片的jQuery对象
        slideArr = $(exports.config.slideDOM).find(">li");
        // 当传入了page的DOM并且幻灯片数量大于1时，生成page，next，prev
        if (exports.config.pageDOM !== null && exports.slideLength > 1) {
            // 生成slide page
            var li;
            slideArr.each(function(i) {
                if (exports.config.pageNum) {
                    // 有页码的page
                    li = '<li><a class="slide-page-cell" page="' + i + '">' + i + "</a></li>";
                } else if (exports.config.pageThumb) {
                    // 有缩略图的page
                    li = '<li><a class="slide-page-cell" page="' + i + '"><img src="' + $(this).find("img").attr("src") + '" /></a></li>';
                } else {
                    // 无页码，无缩略图的page
                    li = '<li><a class="slide-page-cell" page="' + i + '"></a></li>';
                }
                $(exports.config.pageDOM).append(li);
            });
            // 在page中生成“next”和“prev”按钮
            if (exports.config.cutover) {
                $(exports.config.pageDOM).prepend('<li><a class="prev"></a></li>');
                $(exports.config.pageDOM).append('<li><a class="next"></a></li>');
                // 为“next”和“prev”按钮绑定事件
                $(exports.config.pageDOM).find(".next").click(function() {
                    exports.next();
                });
                $(exports.config.pageDOM).find(".prev").click(function() {
                    exports.prev();
                });
            }
            // 缓存幻灯片页码的jQuery对象
            pageArr = $(exports.config.pageDOM).find("li");
            // 为页面绑定点击事件，点击的时候调用play方法
            pageArr.each(function() {
                var page = $(this).find("a.slide-page-cell").attr("page");
                $(this).click(function() {
                    exports.play(page);
                });
            });
        }
        // END if
        // 初始化结束，执行自动播放
        exports.play();
        // 如果只有一张幻灯片，无动画
        if (exports.slideLength === 1) {
            autoPlay = false;
            exports.stop();
        }
    };
});

// Generated by CoffeeScript 1.6.2
define("/assets/vendor/Zonda/util/util-debug", [ "./base64/base64-debug", "./dialog/dialog-debug", "./StateMachine/StateMachine-debug", "./slide/slide-debug", "underscore-debug", "bootstrap-debug", "mustache-debug", "backbone-debug", "easing-debug" ], function(require, exports, module) {
    return module.exports = {
        base64: require("./base64/base64-debug"),
        dialog: require("./dialog/dialog-debug"),
        StateMachine: require("./StateMachine/StateMachine-debug"),
        slide: require("./slide/slide-debug")
    };
});