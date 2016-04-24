'user strict'

module.exports=function(grunt){
    var path=require("path");
    require("load-grunt-tasks")(grunt);
    //Bingo.js List
    var bg_core=["console","core","datavalue","Event","variable","Class","linq","equals","fetch","package","route","cache"],
        bg_mv=["linkToDom","module","factory","model","observer","ajax","compiles","view","filter","render"],
        bg_mv_factory=["base","linq","location","render","timeout"],
        bg_mv_cmp=["base"],
        bg_mv_command=["action","attrs","event","for","route","html","if","include","model","styles","text","include","node","base"],
        bg_mv_filter=["base"];
    var join=function(dir,arr){arr.forEach(function(name,i){arr[i]=path.join(dir,name+".js")});return arr;};
    join("src",bg_core);
    join("src/mv",bg_mv);
    join("src/mv/factory",bg_mv_factory);
    join("src/mv/cmp",bg_mv_cmp);
    join("src/mv/command",bg_mv_command);
    join("src/mv/filter",bg_mv_filter);
    var mixined=bg_core.concat(bg_mv,bg_mv_factory,bg_mv_cmp,bg_mv_command,bg_mv_filter);
    //console.log(mixined);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean:["dist/**"],
        uglify:{
            options:{
                beautify:false,
                exportAll:true,
                "DEBUG": true
            },
            min:{
                files:{
                    "dist/bingo.min.js":["dist/bingo.js"]
                }
            }
        },
        concat: {
            options:{
                separator: ';',
            },
            dist:{
                dest:"dist/bingo.js",src:mixined
            }
        }
    });
    grunt.registerTask("default",["clean","concat","uglify"]);
};