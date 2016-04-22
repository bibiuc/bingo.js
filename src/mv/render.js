
(function (bingo) {
    //version 1.1.0
    "use strict";

    bingo.render = function (tmpl, view, node, tmplObj) {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="tmpl">render 模板</param>
        /// <param name="view">可选, 需注入时用</param>
        /// <param name="node">可选, 原生node, 需注入时用</param>
        bingo.render.regex.lastIndex = 0;
        _commentRegx.lastIndex = 0;
        tmpl = tmpl.replace(_commentRegx, '');

        if (tmpl.indexOf('#') == 0 && tmpl.indexOf('{') < 0) {
            if (view.__render_tmpls__$) {
                tmpl = view.__render_tmpls__$[tmpl];
            }
            if (tmpl && tmpl.indexOf('#') == 0 && tmpl.indexOf('{') < 0)
                tmpl = $(tmpl).html();
        }
        var compileData = null;
        if (!bingo.isNullEmpty(tmpl)) {

            compileData = bingo.render.regex.test(tmpl) ? _compile(tmpl, view, node) : null;

            if (compileData) {

                //tmplObj为转入tmpl == > {'#001':'{{: item.count}}'}

                compileData = _makeForCompile(compileData);
                var allTmpls = null;
                if (view && !view.isDisposed) {
                    allTmpls = (view.__render_tmpls__$ || (view.__render_tmpls__$ = {}));
                    compileData.tmpls && bingo.extend(allTmpls, compileData.tmpls);
                } else
                    allTmpls = (compileData.tmpls || {});

                tmplObj && (allTmpls != tmplObj) && bingo.extend(allTmpls, tmplObj);
                compileData.tmpls = allTmpls;


                if (view && compileData.tmpls) {
                    view.__render_tmpls__$ = bingo.extend({}, view.__render_tmpls__$, compileData.tmpls);
                }

            }
        }

        //console.log('compileData', compileData);
        return {
            //renderItem: function (data, itemName, itemIndex, count, parentData, parentWithIndex, outWithDataList) {
            //    /// <summary>
            //    /// 
            //    /// </summary>
            //    /// <param name="data">数据项</param>
            //    /// <param name="itemName">item名称</param>
            //    /// <param name="itemIndex">item index</param>
            //    /// <param name="count">数据数组数量</param>
            //    /// <param name="parentData">可选, 上级数据</param>
            //    /// <param name="parentWithIndex">可选, 上级withindex, 如果没有应该为 -1</param>
            //    /// <param name="outWithDataList">可选, 数组， 收集withDataList</param>
            //    if (!compileList) return tmpl;
            //    return _renderItem(compileList, view, node, data, itemName, itemIndex, count, parentData, parentWithIndex, outWithDataList);
            //},
            render: function (list, itemName, parentData, parentWithIndex, outWithDataList, formatter) {
                /// <summary>
                /// 
                /// </summary>
                /// <param name="list">数据源</param>
                /// <param name="itemName">可选, item名称</param>
                /// <param name="parentData">可选, 上级数据</param>
                /// <param name="parentWithIndex">可选, 上级withindex, 如果没有应该为 -1</param>
                /// <param name="outWithDataList">可选, 数组， 收集withDataList</param>
                /// <param name="formatter" type="function(s, role, item)">可选, 格式化</param>
                if (!compileData) return tmpl;
                return _render(compileData, view, node, list, itemName, parentData, parentWithIndex, outWithDataList, formatter);
            }
        };
    };

    bingo.render.regex = /\{\{\s*(\/?)(\:|if|else|for|tmpl|header|footer|empty|loading)(.*?)\}\}/g;   //如果要扩展标签, 请在(if )里扩展如(if |for ), 保留以后扩展


    /*
        支持js语句, 如: {{: item.name}} {{document.body.childNodes[0].nodeName}}
        支持if语句, 如: {{if item.isLogin} 已登录 {{else}} 未登录 {{/if}}
        支持for, 如: {{for item in list tmpl=#idAAA}} {{: item_index}}| {{: item.id}}|{{: item_count}}|{{: item_first}}|{{: item_last}} {{/for}}
        支持tmpl(注释)语句, 如 {{tmpl}} {{: item.text}} {{tmpl}}
        支持过滤器, 如: {{: item.name | text}}, 请参考过滤器
    */

    var _renderForeachRegx = /[ ]*([^ ]+)[ ]+in[ ]+(?:(.+)[ ]+tmpl[ ]*=[ ]*(.+)[/]|(.+))*/g;//for 内容分析
    var _endForRegx = /\/\s*$/; //是否单行for, {{for item in list tmpl=$aaaa /}}
    var _commentRegx = /<!--\s*\#(?:.|\n)*?-->/g;//去除注释<!--# asdfasdf-->
    var _newItem = function (content, isIf, isEnd, isTag, view, node, isElse, isForeach, role) {
        var item = {
            isIf: isIf === true,
            ifReturn: true,
            isElse: isElse === true,
            isForeach: isForeach === true,
            isEnd: isEnd === true,
            isTag: isTag === true,
            role: bingo.isUndefined(role) ? 0 : role, //header:1|footer:2|empty:3|loading:4
            content: content,
            forParam: null,
            filterContext: null,
            fn: bingo.noop,
            flt: null,
            children: [],
            //用于存放{{tmpl #001}}的#001值
            tmplId:''
        };
        if (item.isTag) {
            if (!item.isEnd) {
                item.filterContext = content;


                if (item.isForeach) {
                    var code = item.content;
                    _renderForeachRegx.lastIndex = 0;
                    code.replace(_renderForeachRegx, function () {
                        //console.log('code', arguments);
                        var params = item.forParam = {};
                        params.itemName = arguments[1];
                        var dataName = arguments[2];
                        params.tmpl = bingo.trim(arguments[3]);

                        if (bingo.isNullEmpty(dataName))
                            dataName = arguments[4]

                        dataName = bingo.trim(dataName);
                        var flt = bingo.filter.createFilter(dataName, view, node);
                        item.content = flt.content;
                        item.flt = flt;
                        params.dataName = item.content = flt.content;
                        //console.log('render tmpl:', params);
                        //console.log('render tmpl:', arguments);
                    });
                    //console.log('forParam', item.forParam);
                } else {
                    var flt = bingo.filter.createFilter(content, view, node);
                    item.content = flt.content;
                    item.flt = flt;
                }

                var fnTT = _getScriptContextFn(item.content, view)

                item.fn = function (view, data) { return fnTT(view, data, bingo); };//bingo(多版本共存)
            }
        }
        return item;
    };
    var _getScriptContextFn = function (evaltext, view) {
        if (bingo.isNullEmpty(evaltext)) return bingo.noop;
        var oldEvalText = evaltext;
        try {
            return new Function('$view', '$data', 'bingo', [
                'try {',
                    view ? 'with ($view) {' : '',
                        'with ($data || {}) {',
                            'return ' + evaltext + ';',
                        '}',
                    view ? '}' : '',
                '} catch (e) {',
                    'return bingo.isDebug ? ("Error: " + (e.message || e)) : e.message;',
                '} finally {',
                    '$data = null;',
                '}'].join(''));
        } catch (e) {
            if (bingo.isDebug) {
                var errorM = ['Error:', e.message || e, ' render:', oldEvalText].join('');
                throw new Error(errorM);
            } else {
                return function () { return e.message; };
            }
        }
    };

    var _compile = function (s, view, node) {
        var list = [],
            pos = 0, parents = [], _isTmpl = false, tmplCount = 0, _tmplContext = '', _tmplItem = null,
            _last = function (len) { return (len > 0) ? parents[len - 1].children : list; },
            _parent = function (len) { return (len > 0) ? parents.pop().children : list; };
        s.replace(bingo.render.regex, function (findText, f1, f2, f3, findPos, allText) {
            //console.log(findText, 'f1:' + f1, 'f2:' + f2, 'f3:' + f3, findPos);
            //return;

            //收集之前的文本
            var textTemp = allText.slice(pos, findPos);
            var textItem = bingo.isNullEmpty(textTemp) ? null : _newItem(textTemp);
            //console.log(arguments);

            var len = parents.length;
            //取当前列表
            var curList = _last(len);
            var isEnd = (f1 == '/');
            var isTmpl = (f2 == 'tmpl');

            //处理tmpl标签
            if (!_isTmpl) {
                _isTmpl = isTmpl;
                //curList.push(textItem);
                if (isTmpl) {
                    //处理{{tmpl}}
                    textItem && curList.push(textItem);
                    pos = findPos + findText.length;

                    tmplCount = 1;
                    _tmplContext = bingo.trim(f3);

                    //新建一个tmplItem, 累加tmpl的所有内容
                    _tmplItem = _newItem('');

                    if (!bingo.isNullEmpty(_tmplContext)) {
                        if (_tmplContext.indexOf('#') == 0) {
                            //处理{{tmpl #001}}
                            list.push(_tmplItem);//添加到根， 不添加到当前范围
                            _tmplItem.tmplId = _tmplContext;
                            _tmplContext = '';
                        } else {
                            curList.push(_tmplItem);
                            //处理{{tmpl text/html}}
                            _tmplItem.content = [_tmplItem.content, '<script type="', _tmplContext, '">'].join('');
                        }
                    }
                    return;
                }
            } else {
                //_isTmpl != (isEnd && isTmpl);

                if (isTmpl) {
                    if (isEnd) {
                        tmplCount--;
                        _isTmpl = tmplCount > 0;
                    } else
                        tmplCount++;
                }

                //添加之前文本
                _tmplItem.content = [_tmplItem.content, textTemp].join('');

                if (_isTmpl) {
                    //添加文本
                    _tmplItem.content = [_tmplItem.content, findText].join('');
                } else {
                    //退出tmpl, 处理{{/tmpl}}
                    if (!bingo.isNullEmpty(_tmplContext)) {
                        _tmplItem.content = [_tmplItem.content, '</script>'].join('');
                        _tmplContext = '', _tmplItem = null;
                    }
                }
                pos = findPos + findText.length;
                return;
            }
            //end 处理tmpl标签

            var isSpace = (f3.indexOf(' ') == 0); //第一个是否为空格, 语法空格符
            !bingo.isNullEmpty(f3) && (f3 = bingo.trim(f3));

            //else
            var isElse = (f2 == 'else');
            if (isElse) {
                if (!bingo.isNullEmpty(f3)) {
                    //如果else 有条件内容
                    if (!isSpace)
                        isElse = false;//如果没有空格, 不是else
                    else {
                        f3 = bingo.trim(f3);
                        f3 = bingo.isNullEmpty(f3) ? 'true' : f3;
                    }
                } else
                    f3 = 'true';
            }

            //if
            var isIf = (f2 == 'if' || isElse);
            //for
            var isForeach = (f2 == 'for');
            //是否单行for
            var isEndFor = false;
            if (isForeach) {
                isEndFor = _endForRegx.test(f3);
            }

            //header:1|footer:2|empty:3|loading:4|其它:0
            var role = 0;
            switch (f2) {
                case 'header':
                    role = 1;
                    break;
                case 'footer':
                    role = 2;
                    break;
                case 'empty':
                    role = 3;
                    break;
                case 'loading':
                    role = 4;
                    break;
            }
            var item = _newItem(f3, isIf, isEnd, true, view, node, isElse, isForeach, role);


            if (isElse) {
                //返回上一级
                curList = _parent(len);
                //插入之前文本
                textItem && curList.push(textItem);
                len = parents.length;
                //取当前列表
                curList = _last(len);
                //插入项
                curList.push(item);
                //设置为父项
                parents.push(item);
            } else if (isEnd) {
                //返回上一级
                curList = _parent(len);
                //插入之前文本
                textItem && curList.push(textItem);

                if (isIf) {
                    len = parents.length;
                    //取当前列表
                    curList = _last(len);
                    //插入项
                    curList.push(item);
                }
            } else {
                //取当前列表
                curList = _last(len);
                //插入之前文本
                textItem && curList.push(textItem);
                //插入项
                curList.push(item);
                //如果是if, for, role>0, 设置为父项
                (isIf || (isForeach && !isEndFor) || role > 0) && parents.push(item);
            }

            pos = findPos + findText.length;
        });
        if (pos < s.length) {
            list.push(_newItem(s.slice(pos)));
        }
        //console.log(JSON.stringify(list));
        //console.log(list);
        return list;
    }, _makeForCompile = function (list) {
        //header:1|footer:2|empty:3|loading:4
        var obj = {
            header: null,
            footer: null,
            empty: null,
            loading: null,
            tmpls:null,
            body: []
        };
        bingo.each(list, function () {
            if (!bingo.isNullEmpty(this.tmplId)) {
                obj.tmpls || (obj.tmpls = {});
                obj.tmpls[this.tmplId] = this.content;
            } else {
                switch (this.role) {
                    case 1:
                        obj.header = this;
                        break;
                    case 2:
                        obj.footer = this;
                        break;
                    case 3:
                        obj.empty = this;
                        break;
                    case 4:
                        obj.loading = this;
                        break;
                    default:
                        obj.body.push(this);
                        break;
                }
            }
        });
        return obj;
    }, _calcIfReturn = function (compileList, index) {
        var item;
        for (var i = index; i >= 0; i--) {
            item = compileList[i];
            if (item.isEnd && item.isIf) break;
            if (item.isIf && item.ifReturn) {
                return true;
            }
        }
        return false;
    }, _renderCompile = function (compileList, view, node, data, dataWithIndex, outWithDataList, compileData) {
        var list = [], perReturn = [];
        bingo.each(compileList, function (item, index) {
            if (!item.isTag)
                //text
                list.push(item.content);
            else if (!item.isEnd) {
                if (item.isForeach) {
                    var forParam = item.forParam;
                    if (!forParam) return;
                    var tmplId = forParam.tmpl;
                    var dataList = item.flt.filter(item.fn(view, data), data);
                    //if (!dataList) return;
                    var html = '';
                    if (bingo.isNullEmpty(tmplId)) {
                        var compileDataTmpl = item.compileData;
                        if (!compileDataTmpl) {
                            compileDataTmpl = item.compileData = _makeForCompile(item.children);
                            compileDataTmpl.tmpls = compileData.tmpls;
                            item.children = [];
                        }
                        html = _render(compileDataTmpl, view, node, dataList, forParam.itemName, data, dataWithIndex, outWithDataList);
                    } else {
                        if (!item.__renderObj) {
                            var isPath = (tmplId.indexOf('#') != 0);//如果有#开头, 认为ID, 如:'$div1; 否则认为url, 如:tmpl/add.html
                            if (!isPath) {
                                if (compileData.tmpls && compileData.tmpls[tmplId])
                                    html = compileData.tmpls[tmplId]
                                else
                                    html = $(tmplId).html();
                            } else {
                                bingo.tmpl(tmplId, view).success(function (rs) {
                                    html = rs;
                                }).cacheQurey(true).async(false).get();
                            }
                            if (bingo.isNullEmpty(html)) return;
                            item.__renderObj = bingo.render(html, view, node, compileData.tmpls);
                        }
                        html = item.__renderObj.render(dataList, forParam.itemName, data, dataWithIndex, outWithDataList);
                    }
                    list.push(html);
                } else if (item.isIf) {
                    //if
                    //console.log('if------------', item.fn(view, data));
                    if (item.isElse) {
                        //如果上一结果成功或执行条件失败跳过children, 并保存条件结果
                        if (_calcIfReturn(compileList, index - 1) || !(item.ifReturn = item.flt.filter(item.fn(view, data), data)))
                            return;
                    } else {
                        //如果执行条件失败跳过children, 并保存条件结果
                        if (!(item.ifReturn = item.flt.filter(item.fn(view, data), data))) return;
                    }
                    var str = _renderCompile(item.children, view, node, data, dataWithIndex, outWithDataList, compileData);
                    list.push(str);
                } else {
                    //tag
                    var val = item.flt.filter(item.fn(view, data), data);
                    list.push(val);
                }
            }
        });
        return list.join('');
    }, _renderItem = function (compileList, view, node, data, itemName, itemIndex, count, parentData, parentWithIndex, outWithDataList, compileData) {
        var obj = parentData ? bingo.clone(parentData, false) : {};
        obj.$parent = parentData;
        obj.itemName = itemName;
        obj[[itemName, 'index'].join('_')] = obj.$index = itemIndex;
        obj[[itemName, 'count'].join('_')] = obj.$count = count;
        obj[[itemName, 'first'].join('_')] = obj.$first = (itemIndex == 0);
        obj[[itemName, 'last'].join('_')] = obj.$last = (itemIndex == count - 1);
        var isOdd = (itemIndex % 2 == 0);//单
        obj[[itemName, 'odd'].join('_')] = obj.$odd = isOdd;
        obj[[itemName, 'even'].join('_')] = obj.$even = !isOdd;
        obj[itemName] = data;


        //console.log('_renderItem outWithDataList', parentWithIndex);
        outWithDataList && outWithDataList.push(obj);
        var injectIndex = outWithDataList ? outWithDataList.length - 1 : -1;

        var str = _renderCompile(compileList, view, node, obj, itemIndex, outWithDataList, compileData);

        return outWithDataList ? bingo.compile.injectTmplWithDataIndex(str, injectIndex, parentWithIndex) : str;

    }, _render = function (compileData, view, node, list, itemName, parentData, parentWithIndex, outWithDataList, formatter) {
        bingo.isString(itemName) || (itemName = 'item');
        var htmls = [], hT = '';
        var withLen = outWithDataList ? outWithDataList.length : -1, withHtml = null;
        if (withLen >= 0) {
            withHtml = bingo.compile.injectTmplWithDataIndex('', -1, withLen - 1);
            htmls.push(withHtml);
        }
        var isArray = bingo.isArray(list);
        var count = isArray ? list.length : 0;

        //header
        if (compileData.header) {
            hT = _renderItem(compileData.header.children, view, node, null, itemName, -1, count, parentData, parentWithIndex, outWithDataList, compileData);
            formatter && (hT = formatter(hT, 'header', null, -1));
            htmls.push(hT);
        }

        if (bingo.isNull(list)) {
            //null, loading或empty
            var cT = compileData.loading || compileData.empty;
            if (cT) {
                hT = _renderItem(cT.children, view, node, null, itemName, -1, count, parentData, parentWithIndex, outWithDataList, compileData);
                formatter && (hT = formatter(hT, compileData.loading === cT ? 'loading' : 'empty', null, -1));
                htmls.push(hT);
            }
        } else {

            if (!isArray) list = [list];

            if (list.length == 0) {
                //empty
                var cT = compileData.empty || compileData.loading;
                if (cT) {
                    hT = _renderItem(cT.children, view, node, null, itemName, -1, count, parentData, parentWithIndex, outWithDataList, compileData);
                    formatter && (hT = formatter(hT, compileData.loading === cT ? 'loading' : 'empty', null, -1));
                    htmls.push(hT);
                }
            } else {
                //body
                var compileList = compileData.body;
                bingo.each(list, function (item, index) {
                    hT = _renderItem(compileList, view, node, item, itemName, index, count, parentData, parentWithIndex, outWithDataList, compileData);
                    formatter && (hT = formatter(hT, 'body', item, index));
                    htmls.push(hT);
                });
            }
        }

        //footer
        if (compileData.footer) {
            hT = _renderItem(compileData.footer.children, view, node, null, itemName, -1, count, parentData, parentWithIndex, outWithDataList, compileData);
            formatter && (hT = formatter(hT, 'footer', null, -1));
            htmls.push(hT);
        }

        if (withLen >= 0) {
            htmls.push(withHtml);
        }

        return htmls.join('');
    };

})(bingo);
