/**
 * rpcContainer.js
 * 依赖注入
 */
define(function(require, exports, module){
    var _ = require('underscore');

    var RpcClient = require('./client/rpcClient');
    var HttpClientTransport = require('./transport/httpClientTransport');

    // 依赖注入
    var Combination = function ( config ) {

        // 默认传输协议为HTTP
        this.transport = new HttpClientTransport();

        // 合并配置，可能会配置transport
        _.extend( this, config );

        // 根据配置的transport实例化client
        this.client = new RpcClient( this.transport );

        return this;

    }; // END Combination

    // API
    module.exports = Combination;

});
