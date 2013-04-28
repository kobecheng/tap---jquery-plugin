// localStorageSync.js

// Backbone localStorage 适配器
// -----------------------------
// For Backbone with Zonda (c) Degas 2012
// Fork form https://github.com/jeromegn/Backbone.localStorage

define(function(require, exports, module){
    var _  = require('underscore');

	// 生成一个四位的16进制数随机
	function S4 () {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}

	// 生成一个伪GUID
	function guid() {
		return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}

    // Store
    // -----
    // 提供两个方法方便存取LocalStorage对象
	var Store = function () {

		if ( window.localStorage === undefined ) {
			throw new Error('No localStorage!');
		} else {
			window.localStorage.zondaStorage = JSON.stringify({});
		}

		this.set = function ( newLocalStorage ) {
			if ( !newLocalStorage ) {
				return false;
			}

			window.localStorage.zondaStorage = JSON.stringify( newLocalStorage );
		};

		this.get = function () {
			return JSON.parse( window.localStorage.zondaStorage );
		};

		return this;

	}; // END Store

    // 实例化一个 Store 对象
    var store = new Store();

    // Create / Update
    // ------
    // 若 Model id 不不存在
    // 创建该 Model 的一个新实例
    // 保存到 LocalStorage 对应该Model的URL下
    //
    // 若 Model id 存在，则修改该 Model 实例
    var create = function ( model ) {

        if ( model.id === undefined ) {
            model.id = guid();
            model.set(model.idAttribute, model.id);
        }

        // 临时 localStorage 对象
        var tmp = store.get();

        // 创建数组存放该url下的Model实例
        var model_list = tmp[model.url];

        if ( model_list === undefined ) {
            model_list = [];
        }

        // 操作 model_list 数组
        // 如果 model.id 已经存在于 model_list 中，那么直接修改它
        // 若无该 model.id，那么push到 model_list 末尾
        var where = -1;

        _.each( model_list, function ( cell, key ) {
            if ( cell.id === model.id ) {
                where = key;
            }
        });

        if ( where !== -1 ) {
            model_list[where] = model;
        } else {
            model_list.push( model );
        }

        tmp[model.url] = model_list;

        store.set( tmp );

        return model;

    }; // END Create

    // Read
    // ----
    // 读取 LocalStorage 相应的数据后调用 Backbon fetch 函数的 success 方法
    // 更新该 Model
    var read = function ( model, options ) {
        var tmp = store.get(),
            model_list = tmp[model.url];

        // 读取某个 model
        if ( model.id !== undefined ) {
            var where = -1;

            _.each( model_list, function ( cell, key ) {
                if ( cell.id === model.id ) {
                    where = key;
                }
            });

            // 没有该 model 则抛出一个错误
            if ( where === -1 ) {
                options.error( options.error, model );
            } else {
                options.success(model);
                return tmp[model.url][where];
            }

        // 读取所有的 model
        } else {

          if ( model_list ) {
            options.success(model.url);

            return tmp[model.url];
          } else {
            alert (1);
          }

        }
    }; // END Read

    // Update / Create
    // ------
    // alias create
    var update = create;

    // Destroy
    // ------
    // 删除数据
    var destroy = function ( model, options ) {
        var tmp = store.get(),
            model_list = tmp[model.url],
            where = -1;

        try {
            _.each( model_list, function ( vo, key ) {
                if ( vo === undefined ) {
                    //Array.prototype.splice.call( model_list, key, 1 );
                    return;
                }

                if ( vo.id === model.id ) {
                    where = key;
                }
            });

            model_list.splice( where, 1 );

            tmp[model.url] = model_list;

            store.set( tmp );

            options.success(model);

            return model_list;

        } catch (err) {
            options.error( options.error, model );
        }

    }; // END destroy

    // sync
    // ----
    // 对外接口
    // 符合Backbone.sync的API
	var sync = function ( method, model, options ) {

    var success = options.success;

    options.success = function(data) {
      if (success) {
        success(model, data, options);
      }
      model.trigger('sync', model, data, options);
    };

    var error = options.error;

    options.error = function(err) {
      if (error) {
        error(model, err, options);
      }
      model.trigger('error', model, err, options);
    };

		switch ( method ) {
			case "create":
                return create( model, options );
			case "read":
                return read( model, options );
			case "update":
                return update( model, options );
			case "delete":
                return destroy( model, options );
		}

	}; // END sync

	// API
	module.exports = sync;
});
