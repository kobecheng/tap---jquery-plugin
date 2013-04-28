// verify.module.js
// ----------------
// 表单验证，for Bootstrap Form
// 使用verification.module作为验证核心，为Bootsrap表单处理DOM
//
// Util.verify('pre','#sel'); 为'#sel'下的input做预验证，绑定change事件
// Util.verify('all','#sel'); 立即验证'#sel'下的所有input做验证，返回布尔值
// verify 的第二个参数'#sel'参数可省略，省略后默认为'body'

define(function ( require, exports, module ) {

    var _ = require('underscore');

    var verify = function ( type, scope ) {
        // 默认type值为pre
        if ( type === void 0 ) {
            type = 'pre';
        }

        // 默认scope为body
        if ( scope === void 0 ) {
            scope = 'body';
        }

        // 验证结果
        // 数组，如果该数组含有0则表明某项数据验证失败
        var re = [];

        // 通过表单的ruler检查，并且只检查可见的表单的ruler
        var verify = require("./verification");

        var $ = require('jquery');

        // 消息回调函数
        // 作为当前作用域的jQuery对象的扩展
        $.fn.msg = function ( result ) {
            if (  result.status === 0 ) {
                $(this).addClass('error').find('.help-inline').text( result.info );

                // 正在进行全部表单检查出错，则聚焦到此错误表单，并返回false
                if ( type === 'all' ) {
                    // 向结果中加入一个错误标记
                    re.push(0);
                }

            } else {
                $(this).removeClass('error').find('.help-inline').text('');
            }
        }; // END msg

        // 为需要验证的表单项绑定事件
        $( scope ).find(".control-group").each( function () {
            // 只检查“可见”表单的ruler
            var cell = $(this).find("[ruler]:visible");
            var _this = this;

            if ( cell[0] ) {
                // 绑定 change 事件
                cell.live('change', function () {
                    var data = {
                        ruler : cell.attr('ruler'),
                        data  : cell.val()
                    };

                    // 验证数据，并将结果传给消息函数
                    $(_this).msg( verify.check( data ) );

                });
            } // END if

        }); // END each

        // 检查所有表单项目，直到遇到错误的表单，停止，聚焦
        if ( type === 'all' ) {
            // 清空验证结果
            re = [];

            // 遍历所有需要检查的表单
            $( scope ).find(".control-group").each( function () {
                // 只检查“可见”表单的ruler
                var cell = $(this).find("[ruler]:visible");
                var _this = this;

                if ( cell[0] ) {

                    var data = {
                        ruler : cell.attr('ruler'),
                        data  : cell.val()
                    };

                    // 验证数据，并将结果传给消息函数
                    return $(_this).msg( verify.check( data ) );

                } // END if

            }); // END each
        }

        // 结果分析，返回
        if ( _.include( re, 0 ) ) {
            $( scope ).find(".control-group.error").eq(0).find('[ruler]:visible').focus();
            return false;
        } else {
            return true;
        }

    }; // END verify

    // API
    module.exports = verify;

});
