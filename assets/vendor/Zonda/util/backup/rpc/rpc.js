/**
 * rpc.js
 * 对外接口
 * JSON rpc
 */
define(function(require, exports, module){
    var Combination = require('./rpcContainer');

    var Rpc = function ( config ) {
        var comb = new Combination ( config );

        this.newClient = function () {
            return comb.client;
        };

        // TODO
        this.newServer = function () {
            return comb.server;
        };

    }; // END Rpc

    // API
    module.exports = Rpc;

}); // END rpc
