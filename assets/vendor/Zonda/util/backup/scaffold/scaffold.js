/**
 * scaffold.helper.js
 *
 * 栅格系统脚手架工具
 * ------------------
 *
 * makeGrid : 方法，生成遮罩当前页面的栅格系统示意图，以便于检查当前页面的栅格布局
 *            默认为960栅格系统，可通过以下三个参数生成需要的单元格
 *            接受三个参数: columnWidth（单元格宽度）
 *                          columnNum  （单元格数目）
 *                          gutterWidth（单元格间距）
 *
 * destroyGrid : 方法，摧毁已生成的栅格系统示意图
 *
 * toggleGrid : 方法，显示或隐藏栅格系统
 *
 */
define( function ( require, exports, module ) {
    var $ = require('jquery');

    // showGrid 显示标准栅格系统
    exports.makeGrid = function ( columnWidth, columnNum, gutterWidth ) {
        // 清除之前的栅格系统示意图
        exports.destroyGrid();

        // 设定默认值
        if ( !columnWidth || !columnNum || !gutterWidth ) {
            // 每个栅格单元的宽度
            columnWidth = 60;

            //  栅格单元总数
            columnNum   = 12;

            // 栅格单元间隔
            gutterWidth = 20;
        }

        // 栅格单元的容器
        var wrap = '<div class="scaffold-grid-wrap"></div>';

        $(document.documentElement).append( wrap );

        // 插入当前页面后，转为jQuery对象
        wrap = $(".scaffold-grid-wrap");

        // 定义栅格单元的容器样式
        wrap.css({
            // 先隐藏
            'display' : 'none',
            // 计算宽度
            'width' : ( columnWidth + gutterWidth ) * columnNum + 'px',
            // 居中
            'position' : 'absolute',
            'left' : '50%',
            'margin-left' : -1 * ( columnWidth + gutterWidth ) * columnNum / 2 + 'px',
            // 置于最前面
            'z-index' : 1000,
            'top' : 0,
            // 高度100%
            'height' : $(document.documentElement).height(),
            // 背景
            'background' : 'rgba( 255, 255, 255, 0.2)'
        });

        // 生成栅格单元
        var column = '<div class="scaffold-column"></div>';

        // 插入到栅格单元的容器中
        for ( var i=0; i < columnNum; i++ ) {
            wrap.append( column );
        } // END for

        // 定义栅格单元样式
        $(".scaffold-column").css({
            'width' : columnWidth + 'px',
            'height' : '100%',
            'float' : 'left',
            'margin-left' : gutterWidth / 2 + 'px',
            'margin-right' : gutterWidth / 2 + 'px',
            'background' : 'rgba( 0, 0, 0, 0.3)'
        });

    }; // END showGrid

    // 显示或隐藏栅格系统示意图
    exports.toggleGrid = function() {
        if ( $(".scaffold-grid-wrap")[0] ) {
            $(".scaffold-grid-wrap").slideToggle('fast');
        } else {
            if ( window.console ) {
                console.log('No Grid System Schematic!');
            }
        }
    };// END toggleGrid

    // 清除栅格系统示意图
    exports.destroyGrid = function () {
        if ( $(".scaffold-grid-wrap")[0] ) {
            // 直接删除容器DOM
            $(".scaffold-grid-wrap").remove();
        } else {
            if ( window.console ) {
                console.log('Grid System Schematic Destroy!');
            }
        }
    }; // END hideGrid

}); // END scaffold.helper
