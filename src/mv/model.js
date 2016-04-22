//todo:
(function (bingo) {
    //version 1.1.0
    "use strict";

    var _isModel_ = 'isModel1212';
    bingo.isModel = function (p) { return p && p._isModel_ == _isModel_; };
    bingo.modelOf = function (p) { p = bingo.variableOf(p); return bingo.isModel(p) ? p.toObject() : p; };

    var _model = {
        _p_: null, _isModel_: _isModel_,
        toObject: function (obj) {
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
            this.fromObject(this._p_);
        }
    };

    bingo.extend(_model, bingo.variable.eventDef);

    bingo.model = function (p, view) {
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
