﻿
(function (bingo) {
    //version 1.0.1
    "use strict";

    var _isVar_ = 'isVar1212';
    bingo.isVariable = function (p) { return p && p._isVar_ == _isVar_; };
    bingo.variableOf = function (p) { return bingo.isVariable(p) ? p() : p; };

    var _pubModel = function (ow, value, name, change) {
        if (!ow._tid_) {
            ow._changes_ = [];
            ow._changes_F_ = [];
            ow._tid_ = setTimeout(function () {
                delete ow._tid_;
                var c = ow._changes_, cF = ow._changes_F_;
                delete ow._changes_F_;
                delete ow._changes_;
                cF.length > 0 && ow._triggerFn([ow.toObject(), cF, ow], false);
                c.length > 0 && ow._triggerFn([ow.toObject(), c, ow], true);
            }, 1);
        }
        (change ? ow._changes_ : ow._changes_F_).push({ value: value, name: name });
    };

    /*
        观察变量: bingo.variable
        提供自由决定change状态, 以决定是否需要同步到view层
        使用$setChange方法设置为修改状态
    */
    var _variable  = bingo.variable = function (p, owner, view, name) {
        var value = bingo.variableOf(p);
        var fn = function (p1) {
            fn.owner = this;
            if (arguments.length == 0) {
                var rtt = fn._get_ ? fn.$get() : fn.value;
                fn.owner = null;
                return rtt;
            } else {
                p1 = bingo.variableOf(p1);
                var old = bingo.clone(fn.$get());

                if (fn._set_)
                    fn._set_.call(fn, p1);
                else
                    fn.value = p1;
                p1 = fn.$get();
                var change = !bingo.equals(p1, old);

                var ow = fn.$owner() || this;
                if (change)
                    fn.$setChange();
                else {
                    fn._triggerFn([p1], false);
                    if (bingo.isModel(ow)) _pubModel(ow, p1, name, false);
                }
                fn.owner = null;
                return ow;
            }
        };
        fn.$name = name;
        fn._isVar_ = _isVar_;
        //fn.value = value;
        //fn._isChanged = true;
        bingo.extend(fn, _eventDef, _variableDefine);

        _extend && bingo.extend(fn, _extend);

        fn.$owner(owner).$view(view);
        fn(value);

        return fn;
    };

    var _extend = null;
    _variable.extend = function (ex) {
        if (!ex) return;
        _extend = bingo.extend(_extend || {}, ex);
    };

    var _eventDef = bingo.variable.eventDef = {
        _isChanged:true,
        _triggerChange: function () {
            var value = this.$get();
            this._triggerFn([value], true);

            var ow = this.$owner();
            if (bingo.isModel(ow)) _pubModel(ow, value, this.$name, true);
            //this.$view() && this.$view().$updateAsync();
        },
        _addFn: function (fn, change, disposer, priority) {
            (this._fnList || (this._fnList = [])).push({ fn: fn, change: change, disposer: disposer, _priority: priority || 50 });
            this._fnList = bingo.linq(this._fnList).sortDesc('_priority').toArray();
            return this;
        },
        _triggerFn: function (args, change) {
            if (this._fnList) {
                var $this = this, hasRm = false;
                bingo.each(this._fnList, function () {
                    if (this.disposer && this.disposer.isDisposed) {
                        hasRm = true;
                        bingo.clearObject(this);
                        return;
                    }
                    if (change || !this.change)
                        this.fn.apply($this, args);
                });
                if (hasRm) {
                    this._fnList = bingo.linq(this._fnList).where(function () {
                        return this.fn;
                    }).toArray();
                }
            }
        },
        $off: function (callback) {
            if (arguments.length > 0)
                this._fnList = bingo.linq(this._fnList)
                    .where(function () {
                        if (this.fn == callback) {
                            bingo.clearObject(this);
                            return false;
                        } else
                            return true;
                    }).toArray();
            else {
                bingo.each(this._fnList, function () {
                    bingo.clearObject(this);
                });
                this._fnList = [];
            }
        },
        //赋值事件(当在赋值时, 不理值是否改变, 都发送事件)
        $assign: function (callback, disposer, priority) {
            return this._addFn(callback, false, disposer || this.$view(), priority);
        },
        //改变值事件(当在赋值时, 只有值改变了, 才发送事件)
        $subs: function (callback, disposer, priority) {
            return this._addFn(callback, true, disposer || this.$view(), priority);
        },
        //设置修改状态
        $setChange: function (isChanged) {
            this._isChanged = (isChanged !== false);
            if (this._isChanged) {
                this._triggerChange();
            }
            return this;
        },
        $setChangeAsyn: function (isChanged) {
            if (this.__tchangeAsyn)
                clearInterval(this.__tchangeAsyn)
            var $this = this;
            $this.__tchangeAsyn = setTimeout(function () {
                $this.__tchangeAsyn = null;
                $this.$setChange(isChanged);
            }, 2);
            return this;
        },
        $view: function (view) {
            if (arguments.length == 0) {
                return this._view_;
            } else {
                this._view_ = view;
                return this;
            }
        }
    };

    var _variableDefine = {
        size: function () {
            var value = this.$get();
            return value && value.length || 0;
        },
        $get: function (fn) {
            if (arguments.length == 0) {
                return this._get_ ? this._get_.call(this) : this.value;
            } else {
                bingo.isFunction(fn) && (this._get_ = fn);
                return this;
            }
        },
        $set: function (fn) {
            if (bingo.isFunction(fn)) {
                this._set_ = fn;
                this(this.$get());
            }
            return this;
        },
        $owner: function (owner) {
            if (arguments.length == 0) {
                return this._owner_;
            } else {
                this._owner_ = owner;
                return this;
            }
        },
        $linq: function () {
            return bingo.linq(this());
        },
        clone: function (owner) {
            var p = bingo.variable(this.value);
            p._get_ = this._get_;
            p._set_ = this._set_;
            p.$owner(owner || this.$owner()).$view(this.$view());
            return p;
        },
        pop: function () {
            this.$setChangeAsyn(true);
            return this().pop();
        },
        push: function (item) {
            var list = this();
            list.push.apply(list, arguments);
            this.$setChangeAsyn(true);
            return this;
        },
        insert: function (index, item) {
            var list = this(), args = [index, 0].concat(bingo.sliceArray(args, 1));
            list.splice.apply(list, args);
            this.$setChangeAsyn(true);
            return this;
        },
        concat: function () {
            var list = this();
            list.concat.apply(list, arguments);
            this(list);
            this.$setChangeAsyn(true);
            return this;
        },
        reverse: function () {
            this().reverse();
            this.$setChangeAsyn(true);
            return this;
        },
        indexOf: function (item) {
            return bingo.inArray(item, this());
        },
        join: function (s) {
            return this().join(s);
        },
        remove: function (index, count) {
            var list = this();
            list.splice.apply(list, arguments);
            this.$setChangeAsyn(true);
            return this;
        },
        removeItem: function (item) {
            return this.remove(this.indexOf(item), 1);
        }
    };
    
})(bingo);
