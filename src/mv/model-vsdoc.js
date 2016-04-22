//todo:
(function (bingo) {
    //version 1.1.0
    "use strict";

    var _isModel_ = 'isModel1212';
    bingo.isModel = function (p) {
        /// <summary>
        /// 是否model
        /// </summary>
        /// <param name="p"></param>
        return p && p._isModel_ == _isModel_;
    };
    bingo.modelOf = function (p) {
        /// <summary>
        /// 将model转成普通object
        /// </summary>
        /// <param name="p">可以任何参数</param>
        p = bingo.variableOf(p); return bingo.isModel(p) ? p.toObject() : p;
    };



    var _model = {
        _p_: null, _isModel_: _isModel_,
        toObject: function (obj) {
            /// <summary>
            /// 生成到普通obj<br />
            /// toObject()
            /// toObject($view.datas)
            /// </summary>
            /// <param name="obj">可选， 如果传入此参数， 将输出到此obj</param>
            var o = obj || {};
            bingo.eachProp(this, function (item, n) {
                if (bingo.isVariable(o[n]))
                    o[n](item);
                else if (!(n in _model) && n.indexOf('_') != 0)
                    o[n] = bingo.variableOf(item);
            });
            return o;
        },
        fromObject: function (obj, extend) {
            /// <summary>
            /// 一个object或model设置值
            /// </summary>
            /// <param name="obj">只设置现有属性</param>
            /// <param name="extend">是否扩展, 扩展成一个variable</param>
            if (obj) {
                bingo.eachProp(obj, bingo.proxy(this, function (item, n) {
                    if (n in this) {
                        if (bingo.isVariable(this[n])) {
                            this[n](item);
                        } else
                            this[n] = bingo.variableOf(item);
                    } else if (extend) {
                        this[n] = bingo.variable(item);
                    }
                }));
            }
            return this;
        }, toDefault: function () {
            /// <summary>
            /// 还原到初始值
            /// </summary>
            this.fromObject(this._p_);
        }
    };

    bingo.extend(_model, bingo.variable.eventDef);

    bingo.model = function (p, view) {
        /// <summary>
        /// 定义model
        /// </summary>
        /// <param name="p">可以model或object</param>
        /// <param name="view"></param>
        p = bingo.modelOf(p);
        var o = {}, item;
        bingo.eachProp(p, function (item, n) {
            o[n] = bingo.variable(item, o, view, n);
        });

        bingo.extend(o, _model);

        _model.$view(view);

        o._p_ = p;
        return o;
    };


})(bingo);
