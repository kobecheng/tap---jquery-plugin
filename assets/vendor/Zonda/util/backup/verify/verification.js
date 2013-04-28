/**
 * 数据验证模块 verification.js
 * author : Degas
 *
 * API:
 *  check { Function } : 方法；验证数据，接受并返回以下参数；函数
 *      input { Array/Object } : 接受参数；待验证数据，对象包括以下两个成员；对象或数组
 *          input[i].ruler { String/JSON } : 接受参数；验证规则；JSON字符串
 *          input[i].data { String/Other } : 接受参数；待验证参数；各种格式
 *      output { Object } : 返回参数；验证结果，包括以下两个成员；对象
 *          output.status { Number } : 返回参数；验证通过为‘1’，失败为‘0’；对象成员，数字
 *          output.info { String } : 返回参数；验证信息；对象成员，字符串
 *
 *  验证模块使用方法：
 *
 * 验证规则以JSON字符串的形式写在HTML或TPL中
 *  在需要被验证的input/select的节点上加上属性verification，示例如下：
 *  ruler = "{'required':true,'type':'email'}"
 *  或
 *  ruler = "{'required':true,'type':'select','vacancy':'_0'}"
 *
 *  参数说明：
 *  required 值为true或false，若为true，则此项为必填写项
 *  vacancy 值为某个制定的字符串或者数字，表示此表单已填写的默认值
 *  type 值为email，number，分别验证是否为电子邮箱和数字（数字允许出现‘-’）
 *  type 值为select，则将验证该select是否选择，
 *      此时将当前表单已经填写的数据对比vacancy的值，若值为vacancy默认值，
 *      则表示此select未选择，验证不通过
 */

define(function ( require, exports, module ) {
    // 加载Underscore模块
    var _ = require('underscore');
    
    // 加载jQuery模块
    var $ = require('jquery');

    // 数据分类处理，错误信息输出
    // 检查待验证数据格式，为单个数据或一组数据
    var main = function ( input ) {
        // 返回结果
        var result = {};
        var tmp = {};

        try {
            // 一组数据
            if ( _.isArray( input ) ) {
                for ( var i = 0; i < input.length; i++ ) {
                    // 调用check检测
                    tmp = check( input[i].name, input[i].data, input[i].ruler, input[i].title );

                    if ( tmp.status === 0 ) {
                        return tmp;
                    } else {
                        result[ input[i].name ] = input[i].data;
                    }
                } // END for

            // 单个数据
            } else if ( _.isObject( input ) ) {
                // 调用check检测
                tmp = check( input.name, input.data, input.ruler, input.title );

                if ( tmp.status === 0 ) {
                    return tmp;
                } else {
                    result = input;
                }

            } else if ( _.isEmpty( input ) ) {
                throw new Error('待验证数据为空!');
            } else {
                throw new Error('待验证数据格式不正确!');
            }
        } catch (e) {
            if ( typeof console !== undefined ) {
                console.error( e.message );
            } else {
                console = {};
                alert( e.message );
            }
        }

        // 返回数据
        return result;

    };// END  检查数据

    // 验证方法 check
    // 验证规则
    var check = function ( name, data, ruler, title ) {
        var result = {};
        //ruler = eval( '(' + ruler + ')' );
        // 使用JSON方式解析
        ruler = JSON.parse( ruler );

        if ( title === undefined ) {
            title = '';
        }

        // 是否允许为空
        if ( ruler.required && /^\s*$/.test( data ) ) {
            result.info = title + '不能为空';
            result.status = 0;
            return result;
        }

        // 是否允许含有空格
        if ( ruler.noblank && /\s{1,}/.test( data ) ) {
            result.info = title + '此项内容不能包含空格';
            result.status = 0;
            return result;
        }

        // 验证不安全字符
        if ( ruler.xxs && /<{1,}|>{1,}/.test( data ) ) {
            result.info = title + '“<”“>”为非法字符';
            result.status = 0;
            return result;
        }

        // 数据类型为数字
        if ( ruler.type === 'number' && !/^(\d{1,}-){0,}\d*$/.test( data ) ) {
            result.info = title + '格式不是数字';
            result.status = 0;
            return result;
        }

        // 数据类型为手机号码
        if ( ruler.type === 'phone' && !/^\d{11}$/.test( data ) ) {
            result.info = title + '手机号码不正确';
            result.status = 0;
            return result;
        }

        // 数据类型为邮箱
        if ( ruler.type === 'email' && !/^.{1,}@.{1,}\.{1,}\w{1,}$/.test( data ) ) {
            result.info = title + '格式不为Email';
            result.status = 0;
            return result;
        }

        // 验证select表单
        if ( ruler.type === 'select' && ruler.vacancy === data ) {
            result.info = title + '未选择';
            result.status = 0;
            return result;
        }

        // 验证全部通过
        result.status = 1;
        result.info = title + '通过验证';

        return result;
    };// END check

    // API / 对外接口
    module.exports = {
        check : main
    };

});
