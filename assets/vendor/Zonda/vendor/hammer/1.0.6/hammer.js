define("/assets/vendor/Zonda/vendor/hammer/1.0.6/hammer",["jquery"],function(a,b,c){var d=a("jquery"),e=d,f="";(function(a,b){"use strict";function d(){if(!f.READY){f.event.determineEventTypes();for(var a in f.gestures)f.gestures.hasOwnProperty(a)&&f.detection.register(f.gestures[a]);f.event.onTouch(f.DOCUMENT,f.EVENT_MOVE,f.detection.detect),f.event.onTouch(f.DOCUMENT,f.EVENT_END,f.detection.detect),f.READY=!0}}f=function(a,b){return new f.Instance(a,b||{})},f.defaults={stop_browser_behavior:{userSelect:"none",touchAction:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}},f.HAS_POINTEREVENTS=navigator.pointerEnabled||navigator.msPointerEnabled,f.HAS_TOUCHEVENTS="ontouchstart"in a,f.MOBILE_REGEX=/mobile|tablet|ip(ad|hone|od)|android/i,f.NO_MOUSEEVENTS=f.HAS_TOUCHEVENTS&&navigator.userAgent.match(f.MOBILE_REGEX),f.EVENT_TYPES={},f.DIRECTION_DOWN="down",f.DIRECTION_LEFT="left",f.DIRECTION_UP="up",f.DIRECTION_RIGHT="right",f.POINTER_MOUSE="mouse",f.POINTER_TOUCH="touch",f.POINTER_PEN="pen",f.EVENT_START="start",f.EVENT_MOVE="move",f.EVENT_END="end",f.DOCUMENT=document,f.plugins={},f.READY=!1,f.Instance=function(a,b){var c=this;return d(),this.element=a,this.enabled=!0,this.options=f.utils.extend(f.utils.extend({},f.defaults),b||{}),this.options.stop_browser_behavior&&f.utils.stopDefaultBrowserBehavior(this.element,this.options.stop_browser_behavior),f.event.onTouch(a,f.EVENT_START,function(a){c.enabled&&f.detection.startDetect(c,a)}),this},f.Instance.prototype={on:function(a,b){for(var c=a.split(" "),d=0;c.length>d;d++)this.element.addEventListener(c[d],b,!1);return this},off:function(a,b){for(var c=a.split(" "),d=0;c.length>d;d++)this.element.removeEventListener(c[d],b,!1);return this},trigger:function(a,b){var c=f.DOCUMENT.createEvent("Event");c.initEvent(a,!0,!0),c.gesture=b;var d=this.element;return f.utils.hasParent(b.target,d)&&(d=b.target),d.dispatchEvent(c),this},enable:function(a){return this.enabled=a,this}};var j=null,k=!1,l=!1;f.event={bindDom:function(a,b,c){for(var d=b.split(" "),e=0;d.length>e;e++)a.addEventListener(d[e],c,!1)},onTouch:function(a,b,c){var d=this;this.bindDom(a,f.EVENT_TYPES[b],function(e){var g=e.type.toLowerCase();if(!g.match(/mouse/)||!l){g.match(/touch/)||g.match(/pointerdown/)||g.match(/mouse/)&&1===e.which?k=!0:g.match(/mouse/)&&1!==e.which&&(k=!1),g.match(/touch|pointer/)&&(l=!0);var h=0;k&&(f.HAS_POINTEREVENTS&&b!=f.EVENT_END?h=f.PointerEvent.updatePointer(b,e):g.match(/touch/)?h=e.touches.length:l||(h=g.match(/up/)?0:1),h>0&&b==f.EVENT_END?b=f.EVENT_MOVE:h||(b=f.EVENT_END),h||null===j?j=e:e=j,c.call(f.detection,d.collectEventData(a,b,e)),f.HAS_POINTEREVENTS&&b==f.EVENT_END&&(h=f.PointerEvent.updatePointer(b,e))),h||(j=null,k=!1,l=!1,f.PointerEvent.reset())}})},determineEventTypes:function(){var a;a=f.HAS_POINTEREVENTS?f.PointerEvent.getEvents():f.NO_MOUSEEVENTS?["touchstart","touchmove","touchend touchcancel"]:["touchstart mousedown","touchmove mousemove","touchend touchcancel mouseup"],f.EVENT_TYPES[f.EVENT_START]=a[0],f.EVENT_TYPES[f.EVENT_MOVE]=a[1],f.EVENT_TYPES[f.EVENT_END]=a[2]},getTouchList:function(a){return f.HAS_POINTEREVENTS?f.PointerEvent.getTouchList():a.touches?a.touches:[{identifier:1,pageX:a.pageX,pageY:a.pageY,target:a.target}]},collectEventData:function(a,b,c){var d=this.getTouchList(c,b),e=f.POINTER_TOUCH;return(c.type.match(/mouse/)||f.PointerEvent.matchType(f.POINTER_MOUSE,c))&&(e=f.POINTER_MOUSE),{center:f.utils.getCenter(d),timeStamp:(new Date).getTime(),target:c.target,touches:d,eventType:b,pointerType:e,srcEvent:c,preventDefault:function(){this.srcEvent.preventManipulation&&this.srcEvent.preventManipulation(),this.srcEvent.preventDefault&&this.srcEvent.preventDefault()},stopPropagation:function(){this.srcEvent.stopPropagation()},stopDetect:function(){return f.detection.stopDetect()}}}},f.PointerEvent={pointers:{},getTouchList:function(){var a=this,b=[];return Object.keys(a.pointers).sort().forEach(function(c){b.push(a.pointers[c])}),b},updatePointer:function(a,b){return a==f.EVENT_END?this.pointers={}:(b.identifier=b.pointerId,this.pointers[b.pointerId]=b),Object.keys(this.pointers).length},matchType:function(a,b){if(!b.pointerType)return!1;var c={};return c[f.POINTER_MOUSE]=b.pointerType==b.MSPOINTER_TYPE_MOUSE||b.pointerType==f.POINTER_MOUSE,c[f.POINTER_TOUCH]=b.pointerType==b.MSPOINTER_TYPE_TOUCH||b.pointerType==f.POINTER_TOUCH,c[f.POINTER_PEN]=b.pointerType==b.MSPOINTER_TYPE_PEN||b.pointerType==f.POINTER_PEN,c[a]},getEvents:function(){return["pointerdown MSPointerDown","pointermove MSPointerMove","pointerup pointercancel MSPointerUp MSPointerCancel"]},reset:function(){this.pointers={}}},f.utils={extend:function(a,c,d){for(var e in c)a[e]!==b&&d||(a[e]=c[e]);return a},hasParent:function(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1},getCenter:function(a){for(var b=[],c=[],d=0,e=a.length;e>d;d++)b.push(a[d].pageX),c.push(a[d].pageY);return{pageX:(Math.min.apply(Math,b)+Math.max.apply(Math,b))/2,pageY:(Math.min.apply(Math,c)+Math.max.apply(Math,c))/2}},getVelocity:function(a,b,c){return{x:Math.abs(b/a)||0,y:Math.abs(c/a)||0}},getAngle:function(a,b){var c=b.pageY-a.pageY,d=b.pageX-a.pageX;return 180*Math.atan2(c,d)/Math.PI},getDirection:function(a,b){var c=Math.abs(a.pageX-b.pageX),d=Math.abs(a.pageY-b.pageY);return c>=d?a.pageX-b.pageX>0?f.DIRECTION_LEFT:f.DIRECTION_RIGHT:a.pageY-b.pageY>0?f.DIRECTION_UP:f.DIRECTION_DOWN},getDistance:function(a,b){var c=b.pageX-a.pageX,d=b.pageY-a.pageY;return Math.sqrt(c*c+d*d)},getScale:function(a,b){return a.length>=2&&b.length>=2?this.getDistance(b[0],b[1])/this.getDistance(a[0],a[1]):1},getRotation:function(a,b){return a.length>=2&&b.length>=2?this.getAngle(b[1],b[0])-this.getAngle(a[1],a[0]):0},isVertical:function(a){return a==f.DIRECTION_UP||a==f.DIRECTION_DOWN},stopDefaultBrowserBehavior:function(a,b){var c,d=["webkit","khtml","moz","ms","o",""];if(b&&a.style){for(var e=0;d.length>e;e++)for(var f in b)b.hasOwnProperty(f)&&(c=f,d[e]&&(c=d[e]+c.substring(0,1).toUpperCase()+c.substring(1)),a.style[c]=b[f]);"none"==b.userSelect&&(a.onselectstart=function(){return!1})}}},f.detection={gestures:[],current:null,previous:null,stopped:!1,startDetect:function(a,b){this.current||(this.stopped=!1,this.current={inst:a,startEvent:f.utils.extend({},b),lastEvent:!1,name:""},this.detect(b))},detect:function(a){if(this.current&&!this.stopped){a=this.extendEventData(a);for(var b=this.current.inst.options,c=0,d=this.gestures.length;d>c;c++){var e=this.gestures[c];if(!this.stopped&&b[e.name]!==!1&&e.handler.call(e,a,this.current.inst)===!1){this.stopDetect();break}}return this.current&&(this.current.lastEvent=a),a.eventType==f.EVENT_END&&!a.touches.length-1&&this.stopDetect(),a}},stopDetect:function(){this.previous=f.utils.extend({},this.current),this.current=null,this.stopped=!0},extendEventData:function(a){var b=this.current.startEvent;if(b&&(a.touches.length!=b.touches.length||a.touches===b.touches)){b.touches=[];for(var c=0,d=a.touches.length;d>c;c++)b.touches.push(f.utils.extend({},a.touches[c]))}var e=a.timeStamp-b.timeStamp,g=a.center.pageX-b.center.pageX,h=a.center.pageY-b.center.pageY,i=f.utils.getVelocity(e,g,h);return f.utils.extend(a,{deltaTime:e,deltaX:g,deltaY:h,velocityX:i.x,velocityY:i.y,distance:f.utils.getDistance(b.center,a.center),angle:f.utils.getAngle(b.center,a.center),direction:f.utils.getDirection(b.center,a.center),scale:f.utils.getScale(b.touches,a.touches),rotation:f.utils.getRotation(b.touches,a.touches),startEvent:b}),a},register:function(a){var c=a.defaults||{};return c[a.name]===b&&(c[a.name]=!0),f.utils.extend(f.defaults,c,!0),a.index=a.index||1e3,this.gestures.push(a),this.gestures.sort(function(a,b){return a.index<b.index?-1:a.index>b.index?1:0}),this.gestures}},f.gestures=f.gestures||{},f.gestures.Hold={name:"hold",index:10,defaults:{hold_timeout:500,hold_threshold:1},timer:null,handler:function(a,b){switch(a.eventType){case f.EVENT_START:clearTimeout(this.timer),f.detection.current.name=this.name,this.timer=setTimeout(function(){"hold"==f.detection.current.name&&b.trigger("hold",a)},b.options.hold_timeout);break;case f.EVENT_MOVE:a.distance>b.options.hold_threshold&&clearTimeout(this.timer);break;case f.EVENT_END:clearTimeout(this.timer)}}},f.gestures.Tap={name:"tap",index:100,defaults:{tap_max_touchtime:250,tap_max_distance:10,tap_always:!0,doubletap_distance:20,doubletap_interval:300},handler:function(a,b){if(a.eventType==f.EVENT_END){var c=f.detection.previous,d=!1;if(a.deltaTime>b.options.tap_max_touchtime||a.distance>b.options.tap_max_distance)return;c&&"tap"==c.name&&a.timeStamp-c.lastEvent.timeStamp<b.options.doubletap_interval&&a.distance<b.options.doubletap_distance&&(b.trigger("doubletap",a),d=!0),(!d||b.options.tap_always)&&(f.detection.current.name="tap",b.trigger(f.detection.current.name,a))}}},f.gestures.Swipe={name:"swipe",index:40,defaults:{swipe_max_touches:1,swipe_velocity:.7},handler:function(a,b){if(a.eventType==f.EVENT_END){if(b.options.swipe_max_touches>0&&a.touches.length>b.options.swipe_max_touches)return;(a.velocityX>b.options.swipe_velocity||a.velocityY>b.options.swipe_velocity)&&(b.trigger(this.name,a),b.trigger(this.name+a.direction,a))}}},f.gestures.Drag={name:"drag",index:50,defaults:{drag_min_distance:10,drag_max_touches:1,drag_block_horizontal:!1,drag_block_vertical:!1,drag_lock_to_axis:!1,drag_lock_min_distance:25},triggered:!1,handler:function(a,b){if(f.detection.current.name!=this.name&&this.triggered)return b.trigger(this.name+"end",a),this.triggered=!1,void 0;if(!(b.options.drag_max_touches>0&&a.touches.length>b.options.drag_max_touches))switch(a.eventType){case f.EVENT_START:this.triggered=!1;break;case f.EVENT_MOVE:if(a.distance<b.options.drag_min_distance&&f.detection.current.name!=this.name)return;f.detection.current.name=this.name,(f.detection.current.lastEvent.drag_locked_to_axis||b.options.drag_lock_to_axis&&b.options.drag_lock_min_distance<=a.distance)&&(a.drag_locked_to_axis=!0);var c=f.detection.current.lastEvent.direction;a.drag_locked_to_axis&&c!==a.direction&&(a.direction=f.utils.isVertical(c)?0>a.deltaY?f.DIRECTION_UP:f.DIRECTION_DOWN:0>a.deltaX?f.DIRECTION_LEFT:f.DIRECTION_RIGHT),this.triggered||(b.trigger(this.name+"start",a),this.triggered=!0),b.trigger(this.name,a),b.trigger(this.name+a.direction,a),(b.options.drag_block_vertical&&f.utils.isVertical(a.direction)||b.options.drag_block_horizontal&&!f.utils.isVertical(a.direction))&&a.preventDefault();break;case f.EVENT_END:this.triggered&&b.trigger(this.name+"end",a),this.triggered=!1}}},f.gestures.Transform={name:"transform",index:45,defaults:{transform_min_scale:.01,transform_min_rotation:1,transform_always_block:!1},triggered:!1,handler:function(a,b){if(f.detection.current.name!=this.name&&this.triggered)return b.trigger(this.name+"end",a),this.triggered=!1,void 0;if(!(2>a.touches.length))switch(b.options.transform_always_block&&a.preventDefault(),a.eventType){case f.EVENT_START:this.triggered=!1;break;case f.EVENT_MOVE:var c=Math.abs(1-a.scale),d=Math.abs(a.rotation);if(b.options.transform_min_scale>c&&b.options.transform_min_rotation>d)return;f.detection.current.name=this.name,this.triggered||(b.trigger(this.name+"start",a),this.triggered=!0),b.trigger(this.name,a),d>b.options.transform_min_rotation&&b.trigger("rotate",a),c>b.options.transform_min_scale&&(b.trigger("pinch",a),b.trigger("pinch"+(1>a.scale?"in":"out"),a));break;case f.EVENT_END:this.triggered&&b.trigger(this.name+"end",a),this.triggered=!1}}},f.gestures.Touch={name:"touch",index:-1/0,defaults:{prevent_default:!1,prevent_mouseevents:!1},handler:function(a,b){return b.options.prevent_mouseevents&&a.pointerType==f.POINTER_MOUSE?(a.stopDetect(),void 0):(b.options.prevent_default&&a.preventDefault(),a.eventType==f.EVENT_START&&b.trigger(this.name,a),void 0)}},f.gestures.Release={name:"release",index:1/0,handler:function(a,b){a.eventType==f.EVENT_END&&b.trigger(this.name,a)}},"object"==typeof c&&"object"==typeof c.exports?c.exports=f:(a.Hammer=f,"function"==typeof a.define&&a.define.amd&&a.define("hammer",[],function(){return f}))})(this),function(a,b){"use strict";a!==b&&(f.event.bindDom=function(c,d,e){a(c).on(d,function(a){var c=a.originalEvent||a;c.pageX===b&&(c.pageX=a.pageX,c.pageY=a.pageY),c.target||(c.target=a.target),c.which===b&&(c.which=c.button),c.preventDefault||(c.preventDefault=a.preventDefault),c.stopPropagation||(c.stopPropagation=a.stopPropagation),e.call(this,c)})},f.Instance.prototype.on=function(b,c){return a(this.element).on(b,c)},f.Instance.prototype.off=function(b,c){return a(this.element).off(b,c)},f.Instance.prototype.trigger=function(b,c){var d=a(this.element);return d.has(c.target).length&&(d=a(c.target)),d.trigger({type:b,gesture:c})},a.fn.hammer=function(b){return this.each(function(){var c=a(this),d=c.data("hammer");d?d&&b&&f.utils.extend(d.options,b):c.data("hammer",new f(this,b||{}))})})}(d||window.Zepto),c.exports=e});