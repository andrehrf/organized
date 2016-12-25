/**
 * Organized module application
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const fs = require('fs'),
      path = require('path'),
      chokidar = require('chokidar'),
      async = require('async');

class Organized {
    /**
     * Contructor function
     * @return void
     */
    constructor() {
        this.args = {};
        this.stgs = {};
    }
    
    /**
     * Function to set virtual variable
     * @param string key
     * @param mixed value
     * @return void
     */
    set(key, value){
        this.args[key] = value;
    }
    
    /**
     * Function to get virtual variable
     * @param string key
     * @return mixed
     */
    get(key){
        return (this.args[key]) ? this.args[key] : null;
    }
    
    /**
     * Setting function
     * @param object stg
     * @return void
     */
    config(stg = {}){     
        this.stgs = stg;
        
        //Loading modules
        if(typeof stg.modules === "object"){
            if(stg.dev)
                console.info("Organized: loading modules");
            
            for(let key in stg.modules){
                delete require.cache[path.resolve(stg.modules[key])];
                this.args[key] = require(stg.modules[key]);  
            }
        }  
                
        //Settings virtual services
        if(typeof stg.virtual === "object"){
            if(stg.dev)
                console.info("Organized: settings virtual services");
            
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
        
        //Preload settings
        if(typeof stg.preload === "function"){
            if(stg.dev)
                console.info("Organized: preload settings");
            
            var argsArr = [];

            for(let keyArgs in stg.preload_args)
                argsArr.push(this.args[stg.preload_args[keyArgs]]);
            
            stg.preload.apply(this, argsArr);
        }     
        
        try { var length = stg.interceptor.length | 0; } catch(e) { var length = 0; }       
        if(typeof stg.interceptor === "object" && length > 0){
            let _this = this;
            let _stg = stg;
            
            async.series(stg.interceptor, (err, results) => {
                //Mapping controllers diretories
                if(typeof _stg.map === "object"){
                    if(_stg.dev)
                        console.info("Organized: mapping controllers diretories");

                    for(let key in _stg.map){
                        if(fs.lstatSync(_stg.map[key]).isDirectory()){
                            let watcher = chokidar.watch(_stg.map[key] + "/*", {ignored: /[\/\\]\./, persistent: true});

                            watcher.on('add', (filename) => {
                                let argsArr = [];

                                for(let keyArgs in _this.stgs.map_args)
                                    argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);

                                if(_stg.dev)
                                    console.info("Organized: loading " + filename);

                                //delete require.cache[path.resolve(filename)];
                                var obj = module.require(filename);

                                if(typeof obj === "function")
                                    obj.apply(this, argsArr);
                            });
                        }
                        else{
                            let watcher = chokidar.watch(_stg.map[key], {ignored: /[\/\\]\./, persistent: true});

                            watcher.on('add', (filename) => {
                                let argsArr = [];

                                for(let keyArgs in _this.stgs.map_args)
                                    argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);

                                if(_stg.dev)
                                    console.info("Organized: loading " + filename);

                                //delete require.cache[path.resolve(filename)];
                                var obj = module.require(filename);

                                if(typeof obj === "function")
                                    obj.apply(this, argsArr);
                            });
                        }
                    }
                }

                //Bootstrap application
                if(typeof _stg.bootstrap === "function"){
                    if(_stg.dev)
                        console.info("Organized: bootstrap application");

                    let argsArr = [];

                    for(let keyArgs in _stg.bootstrap_args)
                        argsArr.push(this.args[_stg.bootstrap_args[keyArgs]]);

                    _stg.bootstrap.apply(this, argsArr);
                }
            });
        }
        else{
            //Mapping controllers diretories
            if(typeof stg.map === "object"){
                if(stg.dev)
                    console.info("Organized: mapping controllers diretories");

                let _this = this;

                for(let key in stg.map){
                    if(fs.lstatSync(stg.map[key]).isDirectory()){
                        let watcher = chokidar.watch(stg.map[key] + "/*", {ignored: /[\/\\]\./, persistent: true});

                        watcher.on('add', (filename) => {
                            let argsArr = [];

                            for(let keyArgs in _this.stgs.map_args)
                                argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);

                            if(stg.dev)
                                console.info("Organized: loading " + filename);

                            //delete require.cache[path.resolve(filename)];
                            var obj = module.require(filename);

                            if(typeof obj === "function")
                                obj.apply(this, argsArr);
                        });
                    }
                    else{
                        let watcher = chokidar.watch(stg.map[key], {ignored: /[\/\\]\./, persistent: true});

                        watcher.on('add', (filename) => {
                            let argsArr = [];

                            for(let keyArgs in _this.stgs.map_args)
                                argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);

                            if(stg.dev)
                                console.info("Organized: loading " + filename);

                            //delete require.cache[path.resolve(filename)];
                            var obj = module.require(filename);

                            if(typeof obj === "function")
                                obj.apply(this, argsArr);
                        });
                    }
                }
            }

            //Bootstrap application
            if(typeof stg.bootstrap === "function"){
                if(stg.dev)
                    console.info("Organized: bootstrap application");

                let argsArr = [];

                for(let keyArgs in stg.bootstrap_args)
                    argsArr.push(this.args[stg.bootstrap_args[keyArgs]]);

                stg.bootstrap.apply(this, argsArr);
            }
        }
    }
    
    /**
     * Function to bootstrap application
     * @param array dependences
     * @param function onload
     * @return void
     */
    init(dependences = [], onload){       
        if(typeof onload === "function"){
            var argsArr = [];

            for(let keyArgs in dependences)
                argsArr.push(this.args[dependences[keyArgs]]);
            
            onload.apply(this, argsArr);
        }
    }
}

module.exports = new Organized;
