// right.click.menu.module.js
// ----------------
// 基于Bootstrap Dropdown Menu的右键菜单封装
//
// 依赖 bootstrap,jquery
// 默认菜单模板为Bootstrap Mrop Menu模板
//
// Usage:
/**
var Util = require('util');

// 配置
Util.rightClickMenu({
    scope : '#sel',
    option : {
        '新建列表' : function () {
            alert(1);
        },
        '删除' : function () {
            alert(2);
        }
    }
});
*/

define(function( require, exports, module ){
    var $ = require('bootstrap');
    var _ = require('underscore');

    // 插入菜单
    $(document.body).append(
        '<ul id="right-click-menu" class="dropdown-menu" style="display:none;" role="menu" aria-labelledby="dropdownMenu"></ul>'
    );

    // 点击隐藏事件
    $(window).click(function (event) {
        if ( event.button !== 2 ) {
            $("#right-click-menu").empty().hide();
        }
    });

    // 主控制器
    var main = function ( config ) {

        // 右键事件
        $( config.scope ).contextmenu(function (event) {
            event.stopPropagation();

            // 调用菜单控制
            menu(event, config);

            // 禁用浏览器右键
            return false;
        });

    }; // END main

    // 菜单控制
    var menu = function ( event, config ) {

        // 右键事件发生DOM
        var $target = $(event.target);

        // 寻找目标DOM
        $target.parents().each(function () {
            if ( _.include( $(config.target), $(this)[0] ) ) {
                $target = $(this);
            }
        });

        // 右键非选项的DOM，跳出
        if ( !_.include( $(config.target), $target[0] ) ) {
            return false;
        }

        // 显示菜单，并跟随鼠标
        $("#right-click-menu").empty().css({
            'top' : event.clientY,
            'left': event.clientX,
            'display' : 'block'
        });

        // 动态生成菜单选项
        _.each( config.option, function ( callback, optionName ) {
            // 生成唯一ID
            var uid = _.uniqueId('right-click-menu-option-');

            // 插入<button>
            $("#right-click-menu").append(
                '<li><a href="javascript:;" id="' + uid + '" class="right-click-menu-li">' +
                optionName +
                '</a></li>'
            );

            // 事件托管
            $("#right-click-menu").delegate('#'+ uid, 'click', function () {
                event.stopPropagation();
                $("#right-click-menu").hide().undelegate('click');

                // 执行选项回调
                callback( $target );
            });

        }); // END 动态生成

    }; // END 菜单控制

    // API
    module.exports = main;

});
