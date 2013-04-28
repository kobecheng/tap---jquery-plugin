// dialog.module.js
// ----------------
// 基于Bootstrap的对话框封装
//
// 依赖 bootstrap,jquery
// 默认dialog模板为bootstrap modal模板
//
// Usage:
/**
var Util = require('util');

Util.dialog({ // 配置
    title : 'dialog标题' ,
    content : 'dialog内部html或者文本', // 这里将会向dialog内部嵌入编译好的HTML
    button : {  // 按钮，会实例化为按钮对象，绑定点击事件到后面的callback
         '提交' : function() {...},
         '更多' : function() {...}
    },
    css : {
        height: 200,
        color: '#fff'
    } // 传入css，API参照jQuery $('#sel').css()
});

Util.dialog.open(); // 打开dialog

Util.dialog.close(); // 关闭dialog

Util.dialog.close(1300); // 延时1300毫秒关闭

Util.dialog.open().close(1300); // 链式调用

*/

define(function( require, exports, module ){
    var $ = require('bootstrap');
    var _ = require('underscore');

    // 准备模板
    var dialogTPL = require('./dialog.tpl');

    // dialog对象构造函数
    var Constructor = function ( config ) {

        // 已存在dialogDOM时，不打开新窗口
        if ( $("#util-dialog:visible")[0] ) {
            return false;
        }

        // 插入对话框
        $(document.body).append(
            _.template( dialogTPL, {
                'title' : config.title,
                'content' : config.content
            }) // 模板编译
        );

        // 自定义css
        if ( config.css ) {
            $("#util-dialog").css( config.css );
        }

        // 动态创建button
        _.each( config.button, function ( callback, buttonName ) {
            // 生成唯一ID
            var uid = _.uniqueId('dialog-button-');

            // 插入button
            $("#util-dialog .modal-footer").append(
                '<button id="' + uid + '" class="btn btn-success">' +
                buttonName +
                '</button>'
            );

            // 绑定click事件
            $( "#" + uid ).click( callback );
        });

        // 关闭窗口时摧毁dialog对象
        $("#util-dialog").on( 'hide', function(){
            delete $("#util-dialog").modal;
            $("#util-dialog").remove();
        });

        return this;

    }; // END Constructor

    // 打开窗口方法
    Constructor.open = function () {
        $("#util-dialog").modal({
            'show' : true,
            'backdrop' : false
        });

        // 计算当前浏览器窗口可用高度，改变dialog最大高度
        $("#util-dialog .modal-body").css({
            "max-height" : window.innerHeight - 141
        });

        // 计算高度，垂直居中
        var outerHeight = $("#util-dialog").outerHeight();

        $("#util-dialog").css({
            'margin-top' : -outerHeight/2
        });

        return this;
    };

    // 关闭窗口方法
    Constructor.close = function ( delay ) {

        if ( delay ) {
            // 延时关闭
            setTimeout(function() {
                $("#util-dialog").modal('hide');
            }, delay);

        } else {
            $("#util-dialog").modal('hide');
        }
    };

    // 返回对话框引用
    Constructor.dom = $("#util-dialog");

    // API
    module.exports = Constructor;

});
