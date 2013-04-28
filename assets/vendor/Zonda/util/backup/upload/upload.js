// upload.module.js
// ----------------
// 上传模块
//
// Usage : (在app目录下的应用脚本调用)
//
// HTML
/**
<form id="upload-form" target="upload_iframe_hidden" method="POST" name="file-upload-form" action="/attach/addfile" enctype="multipart/form-data">
    <input id="upload-input-file" name="file" type="file" multiple="multiple" />
</form>
<iframe id="upload_iframe_hidden" name="upload_iframe_hidden" style="display:none" src="" frameborder="0"></iframe>
*/

// Javascript
/**
var FILE = require('../module/file.module');

FILE.config = {
    url : 'server', // {STRING} 请求服务器脚本
    fileType : 'png, bmp, zip, rar', // {STRING} 允许上传的文件类型，暂不支持正则
    fileList : $('#upload-block ul')[0], // {DOM} 实例化后的file对象<li>，将插入的目标<ul>
    msg : function ( msg ) { console.log(msg) }, // {FUNCTION}, {msg: OBJECT} 消息回调函数，处理'文件格式错误'等消息，返回参数'msg'，为对象
    uploadForm : $("#upload-form")[0] // {DOM} 为兼容IE浏览器，需要使用<form>配合隐藏<iframe>的方式模拟异步上传文件
                                      // 所以在IE下使用upload模块时，需要先在页面中写好异步上传的<form>，<input:file>和<iframe:hidden>
};

FILE.upload( files ); // {files: HTML5 files 对象} 将HTML5的'files'对象传入upload方法，并启动上传

// 监听upload模块loading事件
// 在开始上传文件时触发
FILE.loading( function ( msg ) {
    $("#load-gif").fadeIn('fast');
});

// 监听upload模块ready事件
// 在全部文件上传完毕后触发
FILE.ready( function ( msg ) {
    $("#load-gif").stop().fadeOut('fast');
});

*/

define(function( require, exports, module ) {
    // 加载 Underscore 模块
    var _ = require('underscore');

    // 加载 jQuery 模块
    var $ = require('jquery');

    // 加载 Backbone 模块
    var Backbone = require('backbone');

    // 用 Backbone 为 exports 做扩展
    _.extend( exports, Backbone.Events );

    // 自定义 loading 模块事件
    exports.loading = function ( callBack ) {
        // 监听 upload 模块 loading 事件
        exports.on('loading', function ( msg ) {
            callBack( msg );
        });
    };

    // 自定义 ready 模块事件
    exports.ready = function ( callBack ) {
        // 监听 upload 模块 ready 事件
        exports.on('ready', function ( msg ) {
            callBack( msg );
        });
    };

    // 配置,初始置为空
    exports.config = {};

    // 必须的参数
    var need = {
        url      : '',
        fileType : '',
        fileList : '',
        msg      : ''
    };

    // 如果为IE浏览器，则需要配置文件上传表单
    if ( $.browser.msie ) {
        need.uploadForm = '';
    }

    // 默认配置 / 模块内部缓存配置
    var _config = {
        fileTpl  : require('./file.tpl')
    };

    /**
     * 检查配置，并重写配置
     */
    var checkConfig = function ( ) {
        // 当配置改变时，重新检查配置
        if ( _.isEqual( _config, exports.config ) ) {
            return false;
        } else {
            // 将当前配置与默认/缓存配置合并
            _.extend( _config, exports.config );

            // 将合并的配置保存到当前配置中
            exports.config = _config;
        }

        // 检查是否包含必须的配置项
        try {
            _.each( need, function ( em, key ) {
                if ( !_.has( exports.config, key ) ) {
                    throw new Error('上传文件模块未配置' + key );
                }
            });

        } catch (e) {
            if ( window.console !== undefined ) {
                console.error( e.message );
            } else {
                alert( e.message );
            }
        }

        // 解析文件类型为数组
        if ( _.isString( exports.config.fileType ) ) {
            // 去掉空格
            exports.config.fileType = exports.config.fileType.replace(/\s{1,}/g, '');
            // 分割成数组
            exports.config.fileType = exports.config.fileType.split(',');
        }

    }; // END checkConfig

    /**
     * checkFileType 内部方法检查文件类型
     * 接受参数: fileList 文件对象
     * 返回符合要求的文件数组
     */
    var checkFileType = function ( fileList ) {
        // 错误消息队列
        var error_msg = [];

        // 正确文件队列
        var correctFileList = [];
        
        // 检查是否为文件夹
        if ( fileList.length !== undefined && fileList.length === 0 ) {
            error_msg.push( '暂不支持直接上传文件夹，请压缩后上传<br />' );
        } else if ( $.browser.msie ) {
            //兼容IE，检测文件名
            var name = $( exports.config.uploadForm ).find('input:file').val().split('.');
            // 后缀，转换为小写
            var suffix = _.last( name ).toLowerCase();

            if ( !_.include( exports.config.fileType, suffix ) ) {
                error_msg.push( '<span class="black">[ ' + name + ' ]</span> 为不允许上传的文件类型<br />' );

                exports.config.msg({
                    'status' : 0,
                    'info'   : error_msg.toString()
                });

                return 0;
            } else {
                // 正确格式的文件压入新的文件队列
                return 1;
            }
        }// END 兼容性 IE

        _.each( fileList, function ( file, key ) {
            var nameArr = file.name.split('.');
            // 后缀，转换为小写
            var suffix = _.last( nameArr ).toLowerCase();

            // 无后缀名
            if ( nameArr.length === 1 ) {
                error_msg.push( '<span class="black">[ ' + file.name + ' ]</span> 无后缀名，请重新选择<br />' );
            } else {
                if ( !_.include( exports.config.fileType, suffix ) ) {
                    error_msg.push( '<span class="black">[ ' + file.name + ' ]</span> 为不允许上传的文件类型<br />' );
                } else {
                    // 正确格式的文件压入新的文件队列
                    correctFileList.push( file );
                }
            } // END if
        }); // END each

        if ( error_msg.length === 0 ) {
            exports.config.msg({
                'status' : 1,
                'info'   : 'success'
            });

        } else {
            // 输出错误消息
            exports.config.msg({
                'status' : 0,
                'info'   : error_msg.toString()
            });
        }

        //返回正确的文件队列
        return correctFileList;

    };// END checkFileType

    /**
     * 获得后端需要的文件类型
     */
    var conv_fileType = function ( fileName ) {
        // 分割文件名
        var nameArr = fileName.split('.');
        // 后缀，转换为小写
        var suffix = _.last( nameArr ).toLowerCase();

        var image = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
        var doc   = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

        if ( _.include( image, suffix ) ) {
            return '1';
        } else if ( _.include( doc, suffix ) ) {
            return '2';
        } else {
            return '3';
        }

    }; // END conv_fileType

    /**
     * 文件DOM形态构造器
     * 属性:
     *     fileType : 文件类型
     *     fileName : 文件名
     *     filePath : 在服务器上的位置
     * 方法：
     *     delete   : 删除DOM形态
     *     loading  : 上传状态
     */
    var DOM = function ( fileName, fileType, fileSize ) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;

        // 加载模板文件并编译
        var file_DOM = _.template( exports.config.fileTpl, this);

        // 插入文件DOM列表中
        $( exports.config.fileList ).prepend( file_DOM );

        // 获得该DOM节点
        this.dom = $( exports.config.fileList ).find('li').eq(0);

        var _this = this;

        // 绑定事件删除该节点
        $( this.dom ).find('.delete').click( function() {
            _this.dom.remove();
        });

        return this;
    };

    /**
     * 兼容IE的上传方法适配
     */
    // 目标iframe缓存
    var uploadIframe = null;

    // 当前正在上传的文件(文件名)
    var uploadCurrentFileName;

    // ieUpload 内置方法，使用同步表单+iframe形式模拟AJAX提交
    var ieUpload = function () {
        // 获取input:file中要上传的文件名，赋给uploadCurrentFileName
        uploadCurrentFileName = $( exports.config.uploadForm ).find('input:file').val();

        // 检查要上传的文件类型是否配置要求
        if ( !checkFileType( uploadCurrentFileName ) ) {
            return false;
        }

        exports.trigger('loading', 'Sending...');

        // 根据配置（同步表单的target）取得返回结果用的iframe，并缓存（性能）
        if ( uploadIframe === null ) {
            uploadIframe = $( 'iframe[name="' + exports.config.uploadForm.target + '"]' );
        }

        // 为该iframe绑定事件，根据配置提供的同步文件上传form的target确定目标iframe
        if ( uploadIframe.attr( 'isBind' ) !== 'yes' ) {
            // 绑定成功后为iframe加上属性 isBind=true，防止再次绑定
            uploadIframe.attr( 'isBind', 'yes' );

            uploadIframe.on( 'load', function () {
                // 初始化文件DOM形态
                var File = new DOM( uploadCurrentFileName );

                try {
                    var data = window.frames[ exports.config.uploadForm.target ].data;

                    if ( data.status === 1 ) {
                        File.dom.find('a').attr('href', data.data.url );

                        exports.trigger('ready', 'Ready');
                    } else {

                        exports.config.msg({
                            'status' : 0,
                            'info'   : '发生错误: ' + File.fileName + data.info
                        });

                        File.dom.remove();

                        exports.trigger('ready', 'Error');
                    }

                } catch (e) {

                    exports.config.msg({
                        'status' : 0,
                        'info'   : '发生错误: ' + File.fileName + e
                    });

                    File.dom.remove();

                    exports.trigger('ready', 'Error');
                }
            });
        } // END bind event

        // JS提交表单
        $( exports.config.uploadForm ).submit();

    }; // END ieUpload

    // upload 对外方法，接受文件对象，并发送文件到服务器
    exports.upload = function ( fileList ) {
        // 检查配置是否满足要求
        checkConfig();

        // 如果为IE浏览器，则使用ieUpload方法上传
        if ( $.browser.msie ) {
            ieUpload();
            return false;
        }

        // 检查要上传的文件类型是否配置要求
        var correctFileList = checkFileType( fileList );

        // 初始化文件的DOM形态,并上传到服务器
        _.each( correctFileList, function ( file, key) {
            // 转化为DOM形态
            var File = new DOM( file.name, file.type, file.size );

            // 对每个文件建立XHR,以及FormData
            var XHR  = new XMLHttpRequest();
            var FileData = new FormData();

            // 将数据加入表单中
            FileData.append( 'file', file );
            FileData.append( 'upload_type', conv_fileType( file.name ) );

            // 向服务器声明以AJAX的方式发送，期望获得AJAX返回
            FileData.append( 'ajax', 1 );

            XHR.open( 'POST', exports.config.url, true );

            exports.trigger('loading', 'Sending');

            // 进度条
            if ( $( File.dom ).find('progress')[0] ) {
                var progress   = $( File.dom ).find('progress')[0];
                progress.min   = 0;
                progress.max   = 100;
                progress.value = 0;

                XHR.onload = function() {
                    $( progress ).hide();
                };

                XHR.upload.onprogress = function ( event ) {
                    if ( event.lengthComputable ) {
                        progress.value =
                        progress.innerHTML = ( event.loaded / event.total * 100 || 0 );
                    }
                };
            } // END progress

            // 获得文件在服务器上的位置
            XHR.onreadystatechange = function () {
                if ( XHR.readyState === 4 ) {
                    try {
                        // 尝试解析JSON返回结果
                        var data = $.parseJSON( XHR.response );

                        if ( data.status === 1 ) {
                            // 以属性的形式将该文件在服务器上的url添加到文件的DOM形态中
                            File.dom.find('a').attr('href', data.data.url);

                            exports.trigger('ready', '完成');
                        } else {

                            exports.config.msg({
                                'status' : 0,
                                'info'   : '发生错误: ' + File.fileName + data.info
                            });

                            File.dom.remove();

                            exports.trigger('ready', 'Error');
                        }
                    } catch (e) {

                        exports.config.msg({
                            'status' : 0,
                            'info'   : '发生错误: ' + e
                        });

                        exports.trigger('ready', 'Error');
                    }// END try catch
                }
            };

            // 上传
            XHR.send( FileData );

        });

    }; // END upload

});
