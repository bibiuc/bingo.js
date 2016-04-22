
(function (bingo) {
    //version 1.0.1
    "use strict";

        // bingo.cmp({
        //     name:'master',
        //     //优先级, 越大越前, 默认100
        //     priority:100,
        //     //是否异步处理
        //     async:false,
        //     //是否引用js
        //     using:false
        //     fn:function($cmp){
        //         $cmp.loadTemp($cmp.node.attr.file);
        //     }
        // });

        bingo.cmp({
            name:'master',
            priority:900,
            async:true,
            fn: function ($cmp) {
                //$cmp = {
                //        find:'',
                //        name:'',
                //        node:{content:'', attr:{file:''}},
                //        name: '',
                //        node: { content: '', attr: { file: '' } },
                //        cmp: {},
                //        replace: function (s, s1) {
                //        },
                //        getAllCmp: function () { },
                //        loadTmpl: function (url, p, callback) { },
                //        ajax: function (url, p, callback) { },
                //        using: function (url) { }
                //}
                $cmp.loadTmpl($cmp.node.attr.file, function (h) {
                    this.replace(h);
                });
            }
        });

        bingo.cmp({
            name:'include',
            async:true,
            fn: function ($cmp) {
                $cmp.loadTmpl($cmp.node.attr.file, function (h) {
                    this.replace(h);
                });
            }
        });

        bingo.cmp({
            name:'using',
            using:true,
            fn:function($cmp){
                $cmp.using($cmp.node.attr.file);
            }
        });

        bingo.cmp({
            name:'contentholder',
            priority:90,
            fn:function($cmp){
                var node = $cmp.node, id = node.attr.id;
                var contentCmp = bingo.linq($cmp.getAllCmp()).where(function () {
                    return this.name == 'content' && this.node.attr.id == id;
                }).first();
                $cmp.replace(contentCmp ? contentCmp.node.content : '');
            }
        });

        bingo.cmp({
            name:'content',
            priority:85,
            fn:function($cmp){
                $cmp.replace('');
            }
        });
})(bingo);
