/**
 * rpcClient.js
 * JSON rpc 客户端
 */
define(function(require, exports, module){
    var Backbone = require('backbone');
    var $ = require('jquery');
    var _ = require('underscore');

    var Client = Backbone.Model.extend({

        initialize : function ( transport ) {
            var _this = this;

            this.transport = transport;

            var transportEvents = [
                'ready:request',
                'error:request',
                'ready:dial',
                'error:dial'
            ];

            _.each( transportEvents, function(event) {
                _this.transport.on( event, function(res, data){
                    _this.trigger( event, res, data );
                });
            });

        },

        // 连接服务器
        dial : function ( url, callback ) {
            // url保存到当前Model
            this.url = url;

            // 调用协议层连接
            this.transport.dial( url, callback );
        },

        // 发送请求
        request : function ( method, data, callback) {
            var DATA = {
                method : method,
                url : this.url,
                data : data
            };

            this.transport.request( DATA , callback );

        }

    });

    module.exports = Client;

}); // END rpc
