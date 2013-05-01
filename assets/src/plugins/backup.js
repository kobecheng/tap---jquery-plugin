// Generated by CoffeeScript 1.6.2
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

define(function(require, exports, module) {
  var $;

  $ = require("jquery");
  $.fn.tap = function(endCallback) {
    startTarget;
    prevTarget;
    startX;
    startY;
    moveOut;
    elBound;
    var activeClass, boundMargin, events, getTarget, getTargetByCoords, noScroll, onEnd, onMove, onStart, supportTouch;

    noScroll = true;
    boundMargin = 50;
    activeClass = "tap-active";
    supportTouch = __indexOf.call(document, 'ontouchend') >= 0;
    events = {
      start: supportTouch ? 'touchstart' : 'mousedown',
      move: supportTouch ? 'touchemove' : 'mousemove',
      end: supportTouch ? 'touchend' : 'mouseup'
    };
    getTargetByCoords = function(x, y) {
      var el;

      el = document.elementFromPoint(x, y);
      if (el.nodeType === 3) {
        return el.parentNode;
      }
      return el;
    };
    getTarget = function(e) {
      var el, touch;

      el = e.target;
      if (el && el.nodeType === 3) {
        return el.parentNode;
      }
      touch = e.targetTouches[0];
      return getTargetByCoords(touch.clientX, touch.clientY);
    };
    onStart = function(e) {
      var elBound, startTarget, startX, startY, target, touch;

      target = getTarget(e);
      if (!target) {
        return;
      }
      $(target).addClass(activeClass);
      startX = e.clientX;
      startY = e.clientY;
      if (!startX || !startY) {
        touch = e.targetTouches[0];
        startX = e.clientX;
        startY = e.clientY;
      }
      startTarget = target;
      return elBound = noScroll ? target.getBoundingClientRect : null;
    };
    onMove = function(e) {
      var moveOut, target, touch, x, y;

      if (!startTarget) {
        return;
      }
      if (noScroll) {
        e.preventDefault();
      }
      target = e.target;
      x = e.clientX;
      y = e.clientY;
      if (!target || !x || !y) {
        touch = e.changedTouches[0];
        if (!x) {
          x = touch.clientX;
        }
        if (!y) {
          y = touch.clientY;
        }
        target = getTargetByCoords(x, y);
      }
      if (noScroll) {
        if (x > elBound.left - boundMargin && x < elBound.right + boundMargin && y > elBound.top - boundMargin && y < elBound.bottom + boundMargin) {
          moveOut = false;
          return $(target).addClass(activeClass);
        } else {
          moveOut = true;
          return $(target).removeClass(activeClass);
        }
      }
    };
    onEnd = function(e) {
      var target;

      if (!startTarget) {
        return;
      }
      target = e.target;
      $(target).removeClass(activeClass);
      return endCallback();
    };
    this.on("click", function(event) {
      event.stopPropagation();
      return event.preventDefault();
    });
    this.on(events.start, onStart);
    this.on(events.move, onMove);
    return this.on(events.end, onEnd);
  };
  return module.exports = $;
});