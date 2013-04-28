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
define(function ( require, exports, module ) {
    var _ = require('underscore');
    var $ = require('easing');

    // 配置,初始置为空
    exports.config = {};

    // 必须的参数
    var need = {
        slideDOM : ''
    };

    // 默认配置 / 模块内部缓存配置
    var _config = {
        speed     : 2000,
        pageDOM   : null,
        pageNum   : false,
        pageThumb : false,
        animation : 'fade',
        cutover   : false
    };

    /**
     * 检查配置，并重写配置
     */
    var checkConfig = function ( ) {
        // 当配置改变时，重新检查配置
        if ( _.isEqual( _config, exports.config ) ) {
            return false;
        } else {
            // 将当前配置与默认/缓存配置合并
            _.extend( _config, exports.config );

            // 将合并的配置保存到当前配置中
            exports.config = _config;
        }

        // 检查是否包含必须的配置项
        try {
            _.each( need, function ( em, key ) {
                if ( !_.has( exports.config, key ) ) {
                    throw new Error('Slide模块未配置' + key );
                }
            });

        } catch (e) {
            if ( window.console !== undefined ) {
                console.error( e.message );
            } else {
                alert( e.message );
            }
        }

    }; // END checkConfig

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
    exports.play = function ( page ) {
        // 计数器置空
        clearTimeout( timer );

        // 传入了page参数，则跳到page指定的幻灯片
        if ( page !== undefined ) {
            // 将当前页码置为传入的page
            onPage = Math.abs( page );

            // 显示幻灯片
            // 根据选择的效果不同，采用不同的方式渲染
            // 淡入淡出 fade
            if ( exports.config.animation === 'fade' ) {
                slideArr.fadeOut('slow');
                slideArr.eq( onPage ).stop().fadeIn('slow');
            // 淡出后，再淡入
            } else if ( exports.config.animation === 'callBackFade' ) {
                slideArr.fadeOut('fast', function () {
                    slideArr.eq( onPage ).fadeIn('fast');
                });
            // 滑动效果
            } else if ( exports.config.animation === 'slip' ) {

                slideArr.eq( onPage -1 ).stop().animate({
                    "left" : "-=960px",
                    "opacity" : "0"
                }, 500);

                slideArr.eq( onPage ).css({
                    "left" : "960px",
                    "opacity" : "0"
                });

                slideArr.eq( onPage ).stop().animate({
                    "left" : "-=960px",
                    "opacity" : "100"
                }, 1500);
            // 未实现的效果，则直接hide/show
            } else {
                slideArr.hide();
                slideArr.eq( onPage ).show();
            }

            if ( pageArr ) {
                // 当前页码加亮
                pageArr.removeClass('on');
                pageArr.eq( onPage ).addClass('on');
            }

        // 无参数，则从onPage对应的幻灯片开始
        } else {
            // 幻灯片播放到最后一张时，跳至第一张
            if ( onPage === (exports.slideLength -1) ) {
                exports.play( 0 );
            } else {
                // 播放下一张
                onPage = onPage +1;

                exports.play( onPage );
            }

            // 不执函数体末尾的延时递归
            return false;
        }

        // 如果当前幻灯片为开头或末尾，则“next”和“prev”按钮加上class
        if ( onPage === 0 && exports.config.cutover ) {
            $( exports.config.pageDOM ).find('.prev').addClass('beginning');
            $( exports.config.pageDOM ).find('.next').removeClass('end');
        } else if ( onPage === (exports.slideLength -1) && exports.config.cutover ) {
            $( exports.config.pageDOM ).find('.next').addClass('end');
            $( exports.config.pageDOM ).find('.prev').removeClass('beginning');
        } else {
            $( exports.config.pageDOM ).find('.prev').removeClass('beginning');
            $( exports.config.pageDOM ).find('.next').removeClass('end');
        }

        // 自动播放，切换速度按照配置执行
        if ( autoPlay ) {
            timer = setTimeout( function () {
                exports.play();
            }, exports.config.speed );
        }

    }; // END play

    // stop 方法
    exports.stop = function () {

        autoPlay = false;

        // 停止回调play方法
        clearTimeout( timer );

    }; // END stop

    // pause 方法
    // 防止在较短的时间内多次调用
    exports.pause = function () {

        if ( autoPlay ) {
            autoPlay = false;

            // 停止回调play方法
            clearTimeout( timer );
        } else {
            autoPlay = true;

            exports.play();
        }

    }; // END pause

    // Next 方法
    exports.next = function () {
        // 当前显示的幻灯片不为最后一张时，onPage加1
        if ( onPage !== (exports.slideLength -1) ) {
            onPage = onPage +1;
        }

        exports.play( onPage );
    }; // END next

    // Prev 方法
    exports.prev = function () {
        // 不为第一张时，onPage减1
        if ( onPage !== 0 ) {
            onPage = onPage -1;
        }

        exports.play( onPage );
    }; // END prev

    /**
     * init 方法
     * 初始化slide
     */
    exports.init = function () {
        // 检查配置
        checkConfig();

        // 将幻灯片个数缓存到模块配置中
        exports.slideLength = $( exports.config.slideDOM ).find('>li').size();

        // 缓存单张幻灯片的jQuery对象
        slideArr = $( exports.config.slideDOM ).find('>li');

        // 当传入了page的DOM并且幻灯片数量大于1时，生成page，next，prev
        if ( exports.config.pageDOM !== null && exports.slideLength > 1 ) {
        
            // 生成slide page
            var li;

            slideArr.each( function (i) {
                if ( exports.config.pageNum ) {
                    // 有页码的page
                    li = '<li><a class="slide-page-cell" page="' + i + '">' + i + '</a></li>';
                } else if ( exports.config.pageThumb ) {
                    // 有缩略图的page
                    li = '<li><a class="slide-page-cell" page="' + i + '"><img src="' + $(this).find('img').attr('src') + '" /></a></li>';
                } else {
                    // 无页码，无缩略图的page
                    li = '<li><a class="slide-page-cell" page="' + i + '"></a></li>';
                }

                $( exports.config.pageDOM ).append( li );

            });

            // 在page中生成“next”和“prev”按钮
            if ( exports.config.cutover ) {
                $( exports.config.pageDOM ).prepend( '<li><a class="prev"></a></li>' );
                $( exports.config.pageDOM ).append( '<li><a class="next"></a></li>' );

                // 为“next”和“prev”按钮绑定事件
                $( exports.config.pageDOM ).find('.next').click( function () {
                    exports.next();
                });

                $( exports.config.pageDOM ).find('.prev').click( function () {
                    exports.prev();
                });
            }

            // 缓存幻灯片页码的jQuery对象
            pageArr = $( exports.config.pageDOM ).find('li');

            // 为页面绑定点击事件，点击的时候调用play方法
            pageArr.each( function () {
                var page = $(this).find('a.slide-page-cell').attr('page');

                $(this).click( function () {
                    exports.play( page );
                });
            });

        } // END if

        // 初始化结束，执行自动播放
        exports.play();

        // 如果只有一张幻灯片，无动画
        if ( exports.slideLength === 1 ) {
            autoPlay = false;
            exports.stop();
        }

    }; // END init

});
