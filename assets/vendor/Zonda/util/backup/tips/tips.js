/**
 * Tips模块
 * author: niko.yerya
 * ******************************************************************************
 * 代码示例
 * [ 单个 ]
 * var Tips = require("tips.module");
 * Tips.one({"target":node,"content":"niko.yerya","action":"hover","name":"tips-box","atuo":true});
 *
 * [ 多个-其中content和action取决于你的html中的属性，单个也支持，但是多个的更能体现优势 ]
 * var Tips = require("tips.module");
 * Tips.some({"target":node});
 *
 * 样式可以自己设定，content可以传入标签创建，例如（多个的话，能够自定义）：
 * <span class="test" tips-info="1" tips-action="hover" >tips test</span>
 *
 * ******************************************************************************
 *
 */

define(function ( require, exports, module ) {

	var dom = document;

	//初始化，传递参数
	function init ( userConfigs ) {
		userConfigs.target = userConfigs.target.find ? userConfigs.target[0] : userConfigs.target;
		userConfigs.content = userConfigs.content || "niko-yerya"; 
		userConfigs.action = userConfigs.action || "hover";
		userConfigs.name = userConfigs.name || "tips-box";
		userConfigs.auto = userConfigs.auto || true;
		createTips( userConfigs );
	}

	//多个类型
	function some ( userConfigs ) {

		(function(){
			var configs = userConfigs;
			var targets = userConfigs.target;
			for( var i = targets.length; i--; ) {
				configs.target = targets[i];
				init(configs);
			}
		})();

	}

	//创造Tips
	function createTips ( userConfigs ) {

		var tipsNode = dom.createElement("span");
			tipsNode.className = userConfigs.name;

		addClass( userConfigs.target, "tips-wrap" );

		if ( userConfigs.target.getAttribute("tips-info") ) {

			tipsNode.innerHTML = userConfigs.target.getAttribute("tips-info");

		} else {

			tipsNode.innerHTML = userConfigs.content;

		}

		if ( userConfigs.target.getAttribute("tips-action") ) {

			userConfigs.action = userConfigs.target.getAttribute("tips-action");

		}

		if ( userConfigs.auto ) {

			userConfigs.target.style.position = "relative";
			userConfigs.target.style.cursor = "help";
			tipsNode.style.position = "absolute";
			tipsNode.style.display = "block";
			tipsNode.style.visibility = "hidden";

		}

		userConfigs.target.appendChild( tipsNode );
		controll( userConfigs );

	}

	//控制器
	function controll ( userConfigs ) {

		switch ( userConfigs.action ) {

			case "hover": 

				addEvent( userConfigs.target, "mouseover", function(event) {
					var event = event || window.event,
						target = event.target || event.srcElement;

					if( !hasClass( target, userConfigs.name ) ) {
						show( target.getElementsByClassName( userConfigs.name )[0] );
					}

				});
				addEvent( userConfigs.target, "mouseout", function(event) {
					var event = event || window.event,
						target = event.target || event.srcElement;

					if( !hasClass(target, userConfigs.name) ) {
						hide( target.getElementsByClassName( userConfigs.name )[0] );
					}
					
				});

			break;

			case "click":

				addEvent( userConfigs.target, "click", function(event) {

					var event = event || window.event,
						target = event.target || event.srcElement,
						tipsNode = target.getElementsByClassName( userConfigs.name )[0];

					if( !hasClass( target, userConfigs.name ) ) { 
						if ( hasClass( target, "tips-clicked" ) ) {
							hide( tipsNode );
							removeClass( target, "tips-clicked" );
						} else {
							show( tipsNode );
							addClass( target, "tips-clicked" );
						}
					}
					
				});

			break;

			default:
			break;
		}	

	}

	//功能函数
	function show ( target ) {
		target.style.visibility = "visible";
	}

	function hide ( target ) {
		target.style.visibility = "hidden";
	}

	//扩充getElementsByClass
	if ( !document.getElementsByClassName ) {

		Object.prototype.getElementsByClassName = function ( classText ) {

			var nodes = [],
				all = this.getElementsByTagName("*");

			for ( var i=all.length; i--; ) {
				if ( all[i].className == classText && all[i].nodeType == 1 ) {
					nodes.push( all[i] );
				}
			}

			return nodes;

		}

	}

	//添加事件
	function addEvent ( node, e, fn ) {

		if ( node.addEventListener ) {
			node.addEventListener( e, fn );	
		} else if (node.attachEvent ) {
			node.attachEvent( "on" + e, fn );
		} else {
			return false;
		}

	}

	//是否有类
	function hasClass ( node, classText ) {

		var classNameText = node.className,
			classArr = classNameText.split(" ");

		if ( classArr.indexOf( classText ) == -1 ) {
			return false;
		} else {
			return true;
		}

	}

	//添加类
	function addClass ( node, classText ) {

		if ( !hasClass( node, classText ) ) {
			node.className += " " + classText;
		}

	}

	//删除类
	function removeClass ( node, classText ) {

		if ( hasClass( node, classText ) ) {
			node.className = node.className.split(" ").join("|").replace(/^(.*)$/g,"|$1|").replace("|"+classText+"|","|").replace(/^|(.*)|$/g,"$1").replace("|"," ");
		}

	}


	module.exports = {
		one: init,
		some: some
	}


});
