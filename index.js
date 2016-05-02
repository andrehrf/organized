'use strict';

const path = require("path"),
      rd = require("require-directory"),
      gulp = require('gulp'),
      sourcemaps = require('gulp-sourcemaps'),
      babel = require('gulp-babel'),
      concat = require('gulp-concat'),
      minify = require('gulp-minify'),
      packer = require('gulp-packer'),
      streamify = require('gulp-streamify'); 

class Organized {
    constructor() {
        this.args = {};
        this.stgs = {};
    }
    
    set(key, value){
        this.args[key] = value;
    }
    
    config(stg = {}){     
        this.stgs = stg;
        
        if(typeof stg.modules === "object"){
            for(let key in stg.modules)
                this.args[key] = require(stg.modules[key]);  
        }  
                
        if(typeof stg.virtual === "object"){
            var names = "";
            var argsArr = [];
                        
            for(let keyArgs in this.args){
                names += `${keyArgs},`;
                argsArr.push(this.args[keyArgs]);
            }
            
            names = names.substr(0, names.length-1);
            
            for(let key in stg.virtual){
                eval(`(function(${names}){
                        this.set("${key}", ${stg.virtual[key]});
                    }).apply(this, argsArr)`);   
            }
        } 
        
        if(typeof stg.map === "object"){
            var argsArr = [];

            for(let keyArgs in stg.map_args)
                argsArr.push(this.args[stg.map_args[keyArgs]]);
            
            for(let key in stg.map){
                rd(module, stg.map[key]+"/", {
                    visit: function(obj){ 
                        obj.apply(this, argsArr);
                    } 
                });
            }
        }
    }
    
    init(dependences = [], onload){       
        if(typeof onload === "function"){
            var argsArr = [];

            for(let keyArgs in dependences)
                argsArr.push(this.args[dependences[keyArgs]]);
            
            onload.apply(this, argsArr);
        }
    }
    
    build(arr, dir){
        if(typeof arr === "object"){
            arr.forEach(function(map){
                var base = path.basename(map.replace("/*.js", ""));
                
                if(base.indexOf(".") > 0)
                    base = "";
                
                gulp.src(map)
                    .pipe(sourcemaps.init())
                    .pipe(babel({presets: ['es2015']}))
                    .pipe(minify({
                        ext:{
                            src:'-debug.js',
                            min:'.js'
                        },
                        exclude: ['tasks'],
                        ignoreFiles: ['-min.js', 'build.js']
                    }))
                    .pipe(streamify(packer({base62: true, shrink: true})))
                    .pipe(through.obj(function(file, enc, cb){
                        var filename = file.relative.replace(".min", "");
                
                        if(file.relative.indexOf("-debug") <= 0)
                            fs.writeFileSync(`${dir}/${base}/${filename}`, file.contents.toString('utf8'));
                        
                        cb();
                    }, function(cb){
                        cb();
                    }))  
                    .pipe(sourcemaps.write('.'))
                    .pipe(gulp.dest(`${dir}/${base}`));
            });
        }
    }
}

module.exports = new Organized;
