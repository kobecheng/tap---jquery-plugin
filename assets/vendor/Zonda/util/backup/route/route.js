// route.module.js
// ---------------
// DOM 路由器
// 但是对于路由来说，加载是一个自动的的过程，需要使用变量
// 于是使用 eval('require("' + a + '")') 实现
// 性能会受到很大的影响，先实现，再优化，或者再废弃这种方式
//
// 兼容Niko的方案，采用回调函数的形式执行
// 代码示例如下:
/**
Util.route({
	'#index' : function(){
		require.async("../app/index/");
	},
	'#header' : function(){
		require.async("../app/header/");
	}
});
*/

define(function ( require, exports, module) {
    return function ( ruler ) {
        var $ = require('jquery');
        var _ = require('underscore');

        _.each( ruler, function ( action, selector ) {
            // 传入callback形式
            if ( $(selector)[0] && _.isFunction(action) ) {
                action();
            // 传入字符串，将在app目录下寻找文件，异步加载
            } else if ( $(selector)[0] && _.isString(action) ) {
                require.async( '../app/' + action );
            } // END if
        });

    }; // END return

});
