
(function (bingo) {

    /*
        使用方法:
        bg-route="view/system/user/list"
    
        连接到view/system/user/list, 目标:main
        <a href="#view/system/user/list" bg-target="main">在main加载连接</a>
        设置frame:'main'
        <div bg-route="" bg-name="main"></div>
    */
    bingo.command('bg-route', function () {
        return {
            priority: 1000,
            replace: false,
            view: true,
            compileChild: false,
            compile: ['$compile', '$node', '$attr', '$location', function ($compile, $node, $attr, $location) {
                /// <param name="$compile" value="function(){return bingo.compile();}"></param>
                /// <param name="$attr" value="bingo.view.viewnodeAttrClass()"></param>
                /// <param name="$node" value="$([])"></param>

                //只要最后一次，防止连续点击链接
                var _last = null;
                $location.onChange(function (url) {
                    if (bingo.location.onLoadBefore.trigger([url, $location]) === false) return;
                    _last && _last.stop();
                    //$location.off('onLoaded');
                    _last = $compile().fromUrl(url).appendTo($node).onCompilePre(function () {
                        $node.html('');
                    }).onCompiled(function () {
                        _last = null;
                        $location.trigger('onLoaded',[$location, url]);
                        bingo.location.onLoaded.trigger([$location]);
                    }).compile();
                });

                $attr.$init(function () {
                    var value = $attr.$attrValue();
                    var pview = $attr.view().$parentView(), ispv = true;
                    var url = bingo.datavalue(pview, value);
                    if (bingo.isUndefined(bingo.isUndefined(url)))
                        url = bingo.datavalue(window, value), ispv = false;

                    if (bingo.isUndefined(url)) {
                        return value;
                    } else {
                        ispv && pview.$subs(value, function (value) {
                            if ($attr.isDisposed) return;
                            value && $location.href(value);
                        });
                        return url;
                    }
                }, function (value) {
                    value && $location.href(value);
                });
            }]
        };
    });

    bingo.command('bg-route-load', function () {
        return ['$location', '$attr', function ($location, $attr) {

                $attr.$initResults(function (value) {
                    bingo.isFunction(value) && $location.onLoaded(function(url){ value.call($location, url); });
                });
            }];
    });

    $(function () {
        $(document.documentElement).on('click', '[href]', function (e) {
            if (bingo.location.onHrefBefore.trigger([e]) === false) return false;
            var jo = $(this);
            var href = jo.attr('href');
            if (href.indexOf('#') >= 0) {
                href = href.split('#');
                href = href[href.length - 1].replace(/^[#\s]+/, '');
                if (!bingo.isNullEmpty(href)) {
                    var target = jo.attr('bg-target');
                    if (bingo.location.onHref.trigger([jo, href, target]) === false) return;
                    var $loc = bingo.location(this);
                    $loc.href(href, target);
                }
            }

        });
    });

})(bingo);
