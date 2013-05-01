#tap.coffee
#
#tap模块
#jquery插件模式,最后暴露新的jquery
#
#touchstart--触发后给绑定对象addClass:ui-hover
#
#touchmove--触发后给绑定对象removeClass:ui-hover
#
#touchend--触发后给绑定对象removeClass:ui-hover,且执行参数传进来的endCallback
#
# -------------------------
#代码实例
#var $ = require(./../tap)
#
#$(selector).tap endCallback
#---------------------------
#
define ( require, exports, module ) ->
  $ = require "jquery"
  
  $.fn.tap= (endCallback) ->

    startTarget
    prevTarget
    startX
    startY
    moveOut  #是否移出元素外
    elBound   #元素的左，上，右和下分别相对浏览器视窗的位置
    noScroll = true
    boundMargin = 50
    activeClass = "tap-active"

    supportTouch = 'ontouchend' in document
    events = 
      start: if supportTouch then 'touchstart' else 'mousedown'
      move: if supportTouch then 'touchemove' else 'mousemove'
      end: if supportTouch then 'touchend' else 'mouseup'
    


#两个工具函数
    getTargetByCoords = (x,y) ->
      el = document.elementFromPoint(x,y)
      return el.parentNode if el.nodeType == 3
      return el

    getTarget = (e) ->
      el = e.target
      if el and el.nodeType == 3
        return el.parentNode
      touch = e.targetTouches[0]
      return getTargetByCoords(touch.clientX,touch.clientY)
#END 工具函数




    #ENENT handler------start,move,end

    #START onStart
    onStart= (e) ->
      target = getTarget e
      return if not target
      
      $(target).addClass activeClass

      startX = e.clientX
      startY = e.clientY

      if not startX or not startY
         touch = e.targetTouches[0]
         startX = e.clientX
         startY = e.clientY

      startTarget = target
      elBound = if noScroll then target.getBoundingClientRect else null
    #END onStart


    #START onMove
    onMove= (e) ->
      return if not startTarget#没有触摸,就没有startTarget

      do e.preventDefault if noScroll
      
      target = e.target
      x = e.clientX
      y = e.clientY

      if not target or not x or not y
        touch = e.changedTouches[0]
        x = touch.clientX if not x
        y = touch.clientY if not y
        target = getTargetByCoords(x,y)

      if noScroll
        if x > elBound.left - boundMargin and x < elBound.right + boundMargin and y > elBound.top - boundMargin and y < elBound.bottom + boundMargin
          moveOut = false
          $(target).addClass activeClass
        else
          moveOut = true
          $(target).removeClass activeClass
    #END onMove


    #START onEnd
    onEnd = (e) ->
      return if not startTarget#没有触摸,就没有startTarget

      target = e.target
      $(target).removeClass activeClass

      do endCallback
    #END onEnd


    #绑定事件
    @on "click", (event) ->
      do event.stopPropagation
      do event.preventDefault
    @on events.start,onStart
    @on events.move,onMove
    @on events.end,onEnd
    #END 绑定事件

  module.exports = $

# END define
