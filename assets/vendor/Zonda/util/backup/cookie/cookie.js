/**
 * cookie模块
 * author: niko.yerya
 * ******************************************************************************
 * 代码示例
 *
 * var cookie = require('path/cookie.module');
 *	
 * 设置cookie 还可跟其他参数，请详见方法注释
 * cookie.setCookie("name","yerya");
 *
 * 读取cookie
 * cookie.getCookie("name");
 *
 * 删除cookie
 * cookie.removeCookie("name");
 * 
 * 删除所有cookie
 * cookie.removeAll();
 *
 * ******************************************************************************
 *
 */

define(function ( require, exports, module ) {

	var dom = document;

	//除去空白的工具函数
	function trim ( cookie ) {
		return cookie.replace(/^[\s]+|[\s]+$|(;)[\s]+|(=)[\s]+/,'$1');
	}

	//获取cookie值
	function getCookie ( name ) {

		//通过在docuemnt.cookie返回的所有cookie中以indexOf方法获取参数名称对应的值
		//其中 encodeURIComponent 在每次setCookie的时候都编码了，所以这里也需要编码查找
		var	cookieName = encodeURIComponent( name ) + "=",
			cookieStart = dom.cookie.indexOf( cookieName ),
			cookieValue = null;

			if ( cookieStart > -1 ) {
				var cookieEnd = dom.cookie.indexOf( ";", cookieStart );
				if ( cookieEnd == -1 ) {
					cookieEnd = dom.cookie.length;
				}
				cookieValue = decodeURIComponent( dom.cookie.substring( cookieStart + cookieName.length, cookieEnd ) );
			}

			return cookieValue;

	}//end getCookie

	//设置cookie( 名称 值 期限 URL路径 可选的域 布尔是否添加secure ),头两个参数必须
	function setCookie ( name, value, expires, path, domain, secure ) {

		var cookieText = encodeURIComponent( name ) + "=" + encodeURIComponent( value );

		if ( expires instanceof Date ) {
			cookieText += "; expires=" + expires.toGMTString();
		}

		if ( path ) {
			cookieText += "; path=" + path;
		}

		if ( domain ) {
			cookieText += "; domain=" + domain;
		}

		if ( secure ) {
			cookieText += "; secure"
		}

		dom.cookie = cookieText;
	}//end setCookie

	//删除cookie值，将cookie时间设置为0即可
	function removeCookie ( name, path, domain, secure ) {
		setCookie( name, "", new Date(0), path, domain, secure );	
	}

	//删除所有cookie
	function removeAllCookie () {

		var cookieText = dom.cookie,	
			arr = cookieText.split("=");

		for ( var i=arr.length; i--; ) {
			var newArr = arr[i].split(';');	
			if ( newArr.length > 1 ) {
				removeCookie( trim ( newArr[1] ) );
			} else {
				removeCookie( trim ( newArr[0] ) );
			}
		}

	}//end removeAllCookie

	//对外接口
	module.exports = {
    	set: setCookie,
    	get: getCookie,
    	remove: removeCookie,
    	removeAll: removeAllCookie	
  	};

});
