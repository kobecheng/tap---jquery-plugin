// gif.module.js
// -------------
// gif 加载示意
// 可复用

define(function( require, exports, module) {
    require('./gif.css');

    var $ = require('jquery');

    // 增加配置
    var main = function ( config ) {
        try {
            // 清掉之前的ajax-loader
            $("#ajax-loader").remove();
        } catch (e) {
        }

        $(document.body).append(
            '<div id="ajax-loader" style="display: none;">Loading ...</div>'
        );

        // 含有配置，采用配置
        if ( config && config.css ) {
            $("#ajax-loader").css( config.css );
        }
    };

    main.open = function () {
        $("#ajax-loader").fadeIn('fast');
        return this;
    };

    main.close = function () {
        $("#ajax-loader").fadeOut('slow');
        return this;
    };

    main();

    // API
    module.exports = main;

});
