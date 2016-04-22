'user strict'

module.exports=function(grunt){
    require("load-grunt-tasks")(grunt);
    //Bingo.js List
    var bg_core=["console","core","datavalue","Event","variable","Class","linq","equals","fetch","package","route","cache"],
        bg_mv=["linkToDom","module","factory","model","observer","ajax","compiles","view","filter","render bingo.mv"],
        bg_mv_factory=["base","linq","location","render","timeout bingo.mv.factory"],
        bg_mv_cmp=["base"],
        bg_mv_command=["action","attrs","event","for","route","html","if","include","model","styles","text","include","node","base"],
        bg_mv_filter=["base"];
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });
};