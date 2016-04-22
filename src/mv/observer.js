//todo:
(function (bingo) {
    //version 1.1.0
    "use strict";

    /*
        观察模式类
    */
    var _observerClass = bingo.Class(function () {
        var _newItem = function (watch, context, callback, deep, disposer, priority) {
            priority || (priority = 50);
            var _isFn = bingo.isFunction(context),
                //取值
                _getValue = function () {
                    var val;
                    if (_isFn) {
                        //如果是function
                        //if (disposer && disposer.isDisposed) { setTimeout(function () { item.dispose(); }); return; }
                        val = context.call(item);
                    }
                    else {
                        var scope = watch._view;
                        val = bingo.datavalue(scope, context);
                        if (bingo.isUndefined(val))
                            val = bingo.datavalue(window, context);
                    }
                    return val;
                },
                _oldValue = _getValue();
            var item = {
                _callback: callback,
                dispose: _dispose,
                _priority: priority
            };

            if (bingo.isVariable(_oldValue) || bingo.isModel(_oldValue)) {
                item.check = _varSub;
                item.isChange = false;
                var view = watch._view;
                item.varo = _oldValue;
                _oldValue.$subs(function (value, name, m) {
                    callback.call(item, value, name, m);
                    watch.publishAsync();
                }, disposer || view, priority);
            } else {
                var lv = bingo.observer.compareLv;
                deep = (lv > 0 ? true : deep);
                if (deep) _oldValue = bingo.clone(_oldValue, true, false, lv);
                item.check = function () {
                    if (disposer && disposer.isDisposed) { item.dispose && item.dispose(); return; }
                    var newValue = _getValue(),
                        isChange = deep ? (!bingo.equals(newValue, _oldValue)) : (newValue != _oldValue);
                    if (isChange) {
                        _oldValue = deep ? bingo.clone(newValue, true, false, lv) : newValue;
                        callback.call(this, newValue);
                        return true;
                    }
                    return false;
                };
            }
            return item;
        };

        var _varSub = function () {
            return false;
        }, _dispose = function () { bingo.clearObject(this); };

        this.Define({
            unSubscribe: function (callback) {
                /// <summary>
                /// 取消订阅
                /// </summary>
                /// <param name="callback">可选, 不传则取消全部订阅</param>
                if (arguments.length > 0)
                    this._subscribes = bingo.linq(this._subscribes)
                        .where(function () {
                            if (this._callback == callback) {
                                this.dispose();
                                return false;
                            } else
                                return true;
                        }).toArray();
                else {
                    bingo.each(this._subscribes, function () {
                        this.dispose();
                    });
                    this._subscribes = [];
                }
                return this;
            },
            subscribe: function (context, callback, deep, disposer, priority) {
                /// <summary>
                /// 订阅
                /// </summary>
                /// <param name="context">
                ///     观察内容:
                ///         $view的属性, 如, $view.title = '标题', subscribe('title'....
                ///         方法如果subscribe(function(){ return $view.title;}, .....
                /// </param>
                /// <param name="callback">
                ///     观察到改变后执行的内容
                /// </param>
                /// <param name="deep">是否深层比较, 默认true</param>
                /// <param name="disposer">自动释放对象, 必须是bingo.Class定义对象</param>
                /// <returns value='{check:function(){}, dispose:function(){}}'></returns>
                var item = _newItem(this, context, callback, deep, disposer, priority);
                this._subscribes.push(item);
                this._subscribes = bingo.linq(this._subscribes).sortDesc('_priority').toArray();
                return item;
            },
            //发布信息
            publish: function () {
                //计数清0
                this._publishTime = 0;
                this._publish && this._publish();
                return this;
            },
            publishAsync: function () {
                if (!this._pbAsync_) {
                    var $this = this;
                    this._pbAsync_ = setTimeout(function () {
                        $this._pbAsync_ = null; $this.publish();
                    }, 5);
                }
                return this;
            },
            _publishTime: 0,//发布计数
            _publish: function () {
                var isChange = false, hasRm = false;
                bingo.each(this._subscribes, function () {
                    if (!this.check) {
                        hasRm = true; return;
                    }
                    if (this.check())
                        isChange = true;
                });
                if (hasRm) {
                    this._subscribes = bingo.linq(this._subscribes)
                        .where(function () { return this.check; }).toArray();
                }
                if (isChange) {
                    if (this._publishTime < 10) {
                        //最多连接10次, 防止一直发布
                        this._publishTime++;
                        var $this = this;
                        setTimeout(function () { $this.isDisposed || $this._publish(); }, 5);
                    }
                } else
                    this._publishTime = 0;
            }
        });

        this.Initialization(function (view) {
            this._view = view,
            this._subscribes = [];

            this.disposeByOther(view);
            this.onDispose(function () {
                bingo.each(this._subscribes, function () {
                    this.dispose();
                });
            });
        });

    });

    bingo.observer = function (view) {
        return view && (view.__observer__ || (view.__observer__ = _observerClass.NewObject(view)));
    };
    bingo.observer.observerClass = _observerClass;

    bingo.observer.compareLv = 2;//比较层次， -1所有层次, 0为直接比较

})(bingo);
