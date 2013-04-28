# Zonda

[![Build Status](https://travis-ci.org/smallsmallwolf/Zonda.png?branch=master)](https://travis-ci.org/smallsmallwolf/Zonda)

- - -

Zonda——Degas自家用的前端框架。

感谢和我一起建造Zonda的朋友们，亲爱的[Niko](http://niko-blog.com/)，[leohgbs](https://github.com/leohgbs)，[bronze1man](http://bs.ikm.me/)。

BUG还很多，发现一个修复一个。已在几个项目中使用，不断更新，不断学习~

## Zonda行车手册

### 依赖
- - -
- Linux/Unix/Mac OS X
- NodeJs v0.8.21
- SPM v1.8.0-dev
- Less v1.3.3
- CoffeeScript v1.6.1


### 点火，起步！
- - -

`git clone https://github.com/smallsmallwolf/Zonda.git` 将Zonda拉到Web服务的文件根目录(Web服务器`/`的位置，放到这里主要是为了方便)，然后执行：

```shell
cd Zonda/tool
./setup.sh
```

执行完毕后，Zonda会根据`Zonda/project-template`创建一个前端项目模板，目录结构大致是这样的：

```coffeescript
assets/ # 前端项目根目录
  etc/ # 项目配置文件  
    env.js # for Seajs
    package.json # for spm build
  vendor/ # 第三方组件
    Zonda/
  src/ # 你的应用程序源代码 
  ui/ # 你的应用程序的UI文件
    less/
      config.less
      mixin.less
      responsive.less
    images/
    ie/
      ie.css      
  test/ # 测试你的应用程序
    index.html # 测试页面
    case-list.coffee # require 你的测试用例
    case-list.js # case-list.coffee 的编译结果
    qunit/ # Qunit 的必要文件
      qunit.js
      qunit.css
    case/ # 你的应用程序的测试用例
      base64.coffee # Zonda.Util.base64 的测试用例，放到这里做个示例
      base64.js # base64.coffee 的编译结果
  dist/ # 线上版本的应用程序代码
    dist-dev.css
    framework-dev.js
    app-dev.js   
  tool/ # 工具(打包应用程序，Less编译工具等等)
  Gruntfile.js # Grunt 配置，用于测试你的应用程序
```

页面上将要引入的CSS和Javascript文件如下：

```html
<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Let's Rock!</title>
  <link rel="stylesheet" href="/assets/dist/dist-dev.css" />
</head>
<body>

... 

<script src="/assets/dist/framework-dev.js" id="seajsnode" data-main="/assets/dist/app-dev.js" ></script>
  
</body>
</html>
```

Nice，Zonda现在已经发动了，驾驶着它在前端的赛道上驰骋吧~

### CSS/Less & Images
- - -

Less dir: `assets/ui/less`，放置你的项目的样式

Images dir: `assets/ui/images`，你项目中用到的图片文件

Bootstrap dir: `assets/vendor/Zonda/ui/less`，Zonda默认提供使用Bootstrap作为UI基础，在`assets/ui/less/config.less`中，`@import`了Bootstrap的Less源文件，如果不需要Bootstrap，可以在`config.less`将该行注释，但真心不建议这么做，Bootstrap可是个好东西。

Less实时编译工具，这个工具可能有点小Bug，欢迎Issue：

```shell
cd assets/tool
./less-compile.sh
```

执行上面的命令将会开始监听`assets/ui/less`目录，如果文件有修改，则会编译，并将所有`@import`的Less编译成一个CSS文件(包括Bootstrap和Font Awesome)输出到`assets/dist/dist-dev.css`，也就是页面上引入的那个CSS文件。

Less编译工具使用NodeJs(v0.8.21)和Lessc(v1.3.3)，源文件在`tool/module/lessCompiler.coffee`。它目前只能提供简单的监听文件改变并编译的功能，并且将所有的Less文件编译成一个CSS。

`lessCompiler.coffee`默认会将Less中的注释去掉，如果需要保留注释以便调试，则将文件中的：

```coffeescript
lessc_command = "lessc -x"
# 去掉 -x，改成下面这样即可
lessc_command = "lessc"
```

`lessCompiler.coffee`缺少一个不将Less合并成一个CSS的功能，还缺少将`dist-dev.css`压缩的功能，以后会尝试实现的，欢迎Issue~

### JavaScript/CoffeeScript
- - -

Javascript dir: `assets/src`，这里放置你的项目源代码。如果使用CoffeeScript，那么直接将Coffee文件编译到当前目录下就行了，推荐一个Vim-CoffeeScript插件[vim-coffee-script](https://github.com/kchmck/vim-coffee-script)

Zonda dir: `assets/vendor/Zonda`，这里是Zonda的框架代码，框架里已经包含了一些必要的库，都已做成seajs module，包括：

```
SeaJs v2.0.0pre
jQuery v1.9.1
Underscore v1.4.4
Backbone v0.9.10
Bootstrap(jQuery plugins) v2.3.1
Modernizr v2.6.2
Mustache
```

### 开发模式(dev)与线上模式(prod)
- - -

```shell
cd assets/tool/

# 切换至开发模式：生成 framework-dev.js，app-dev.js
./build.sh dev

# 切换至线上模式：生成 framework-version.js，app-version.js
./build.sh prod
```

**DEV模式**

期望实现的目标：不压缩合并任何应用代码和第三方模块。

`/assets/dist/framework-dev.js`
实现思路：
在开发模式下(dev)，该文件就是 SeaJs 源码 + SeaJs plugin(没有加入 combo，flush插件);
SeaJs 的配置文件为 env.js (以后有时间了可以考虑使用 Yaml，或者直接 CoffeeScript )，用工具将 `assets/vendor/Zonda/vendor` 以及 `assets/vendor/` 读取一遍，生成出 env.js 需要使用的 SeaJs 的 `alias`，然后将生成好的 env.js cat 到 SeaJs 源代码底部，当有第三方模块更新，或者 SeaJs 更新时，只需要重新执行 `./build.sh dev` 即可。

env.js 应该大概是这个样子：

```javascript
seajs.config({
  base: "/assets",
  alias: {
    "jquery" : "vendor/Zonda/vendor/jquery/1.9.1/jquery/src/jquery"
  },
  charset: "utf-8"
});
```
`assets/dist/app-dev.js`
实现思路：
在开发模式下(dev)，该文件只有一行：
```javascript
seajs.use("/assets/src/app");
```

**PROD模式**

期望实现的目标：将 SeaJS，jQuery 等第三方模块压缩合并到`framework-version.js`，将`src`下应用程序源码压缩合并到`app-version.js`，最终将 Javascript 文件的连接数优化为2个，并且带有文件MD5值的版本号，以便控制其发布。

`assets/dist/framework-version.js`
实现思路：
在线上模式(prod)，该文件包含了`framework-dev.js`，`vendor/`下的各个第三方模块。

`assets/dist/app-version.js`
实现思路：
在线上模式(prod)，该文件为`assets/src/app-version.js`将其`src`内的依赖打包合并后的文件，需要在最后一行加上：
```javascript
seajs.use("/assets/dist/app.js");
```

以便 SeaJS 将它视作应用入口。

**spm build**

这里使用`spm`工具来实现 prod 模式，但是 spm 没有实现这里"将第三方模块与应用程序代码分别打包"的需求，所以目前使用脚本来实现，执行`build.sh prod`时，自动生成`spm`要使用的 package.json

这里对`require("jquery")`这样的第三方依赖没有做处理，是因为`jquery`模块已经打包压缩到`framework-version.js`中了，并且其模块ID为`env.js`中配置的`alias`所指明的ID。所以`app-version.js`中调用`require("jquery")`时会根据`seajs.config`中`alias`的配置去调用，这里就没有问题了。

需要注意的是这里将第三方模块打包到`framework-version.js`是由Zonda的工具来完成的，并不是由spm，所以`framework-version.js`里到底 combo 了哪些第三方模块，以及这些模块的顺序，全部都由`etc/package.json`中的`dependencies`决定的。

### 调用框架模块

```coffeescript
Util = require "util"

Util.base64.encode "床前明月光"
```

### Base64 模块 (stable)
- - -
**Usage**
```coffeescript
Util = require "util"

Util.base64.encode "疑是地上霜"

# return "eyJjb25kaXRpb24iOiJcdTc1OTFcdTY2MmZcdTU3MzBcdTRlMGFcdTk3MWMiLCJiYXNlX2lkIjoiMSJ9"

Util.base64.decode "eyJjb25kaXRpb24iOiJcdTRlM2VcdTU5MzRcdTY3MWJcdTY2MGVcdTY3MDgiLCJiYXNlX2lkIjoiMSJ9"

# return "举头望明月"
```

### State Machine (stable)
- - -
**功能：**
Util.StateMachine 返回状态机构造器，stateMachine = new Util.StateMachine，获得状态机实例，每个状态机实例相互独立；
每个状态机里可以存储多个“视图状态”，假设有一个列表视图`list_view`，为这个视图状态申明两个动作：
- 激活动作：这个动作触发时，`list_view`视图将被激活，我们要为这个视图状态呈现哪些DOM；
- 关闭动作：当`list_view`视图被关闭时，我们将要隐藏哪些DOM；

状态机中的“视图状态”都是互斥的，比如`list_view`是在登陆之后可见，那么`login_view`和`list_view`比如是互斥的。所以在激活某一个状态机中一个视图状态时，该状态机中的其他视图将被关闭。

**实现：**
基于Backbone的Event实现，先申明某一个视图状态及其“激活”和“关闭”动作，然后将它加入到某个状态机中（或某几个状态机中），在使用时直接调用该视图状态的`active`方法即可。

**Usage**
```coffeescript
Util = require "Util"

mainStateMachine = new Util.StateMachine()

list_view =
  activate: ->
    $("#main-list").show()
    $("#main-list-nav").show()
  deactivate: ->
    $("#main-list").hide()
    $("#main-list-nav").hide()
    
mainStateMachine.add list_view

module.exports =
  list: list_view

```

### 使用Qunit和Sinon测试
- - -

#### 测试应用代码
这里你需要使用 [Grunt](http://gruntjs.com/)，你的项目的根目录下已经有了一个 Grunt 文件，并且已经有了在 CLI 环境下测试必要的 node_module，这些都是在执行 Zonda 的 `setup.sh` 时完成的。

在 /assets/test 你会发现，有一个 index.html，那就是测试页面，你可以直接在浏览器上访问它
```
http://yoursite.address/assets/test/index.html
```
这时，Qunit 会跑你的测试。这是在本机的浏览器上跑测试的方式，还可以用 Grunt 的 Qunit + Phantom 插件在 CLI 上跑测试：
```shell
/assets/tool/test.sh
```
这样就会使用 Phantom 在 CLI 下去跑我们的测试页面。

关于此类 Headless Test，可以参见笔者的这个介绍 [Headless Test：前端自动测试实践](https://github.com/smallsmallwolf/Zonda/issues/46)。

在 Qunit 中使用 [Sinon](http://sinonjs.org/) 来 mock Ajax，可以参照这篇文章 [Using Sinon.JS with QUnit](http://cjohansen.no/en/javascript/using_sinon_js_with_qunit)，当然，Sinon 还能做很多高级的事情~

### 升级Zonda
- - -

`git clone`一个最新的 Zonda，然后将你的项目中的 vendor/Zonda 里的 Zonda 替换即可，so easy。
从这个版本开始，Zonda 的目录结果和组织方式已经稳定下来了。经历了几个复杂项目的考验，Zonda 被重构了3次左右，每一次都解决了一些实际开发中大家反馈回来的问题，Zonda 变得更快更高效了，自己的技术也因此提高很多。

在未来，Zonda 还会是一个默默无闻的框架，但是我会持续的开发它，因为它在和我一起成长，一起变老。

### 致谢
- - -
感谢我的未婚妻：Lorna。没有你，我也许活得像台机器

感谢我所在的团队：E++ Studio，你们给我很多挑战和信任，让我在很多关键性项目中使用 Zonda，没有你们的支持，可能我们的很多项目中在用的是 YUI 或者 Kissy

感谢 Seajs，SPM，Nodejs，Less，Coffee 的作者，你们让前端的工作更愉快，更高效。

最后，还要感谢党国的悉心栽培，让我能在和平的社会中，坐在屏幕前敲着代码，抽着烟。
