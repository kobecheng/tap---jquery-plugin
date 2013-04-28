/**
 * 客户端HTTP协议层
 */
define(function(require, exports, module){

    function HttpClientTransport () {

        var Backbone = require('backbone');
        var _ = require('underscore');

        _.extend( this, Backbone.Events );

        /**
         * this.status 连接状态
         * status = 0;未连接
         * status = 1;连接成功
         */
        this.status = 0;

        // 连接服务器
        this.dial = function ( url, callback ) {
            // 缓存url
            this.url = url;

            var _this = this;

            callback = callback || function(){};

            // 尝试连接Rpc服务器，不发送任何数据
            $.ajax({

                url : this.url,

                type : "POST",

                dataType : "JSON",

                data : {},

                error : function ( err ) {
                    _this.trigger('error:dial', err);
                },

                success : function ( res ) {
                    // 返回值为JSON，则认为Rpc服务器可用
                    _this.trigger('ready:dial', res);
                    callback( res ); // 调用回调
                } // END success
            }); // END ajax
        }; // END dial

        // 通过Ajax向服务器发送数据
        // 这里会将已经发送的数据放回callback中
        this.request = function ( data, callback ) {
            var _this = this;

            callback = callback || function(){};

            $.ajax({

                url : this.url,

                type : "POST",

                dataType : "JSON",

                data : data,

                error : function ( err ) {
                    _this.trigger('error:request', err, data);
                },

                success : function ( res ) {

                    switch ( res.status ) {
                        case 1:
                            _this.trigger('ready:request', res, data);
                            break;
                        case 0:
                            _this.trigger('error:request', res, data);
                            break;
                        default:
                            _this.trigger('ready:request', res, data);
                    } // END switch

                    // 调用回调
                    callback( res, data);

                } // END success
            }); // END ajax
        }; // END request

        return this;
    }

    // API
    module.exports = HttpClientTransport;

});
