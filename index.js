/**
 * Organized module application
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const fs = require('fs'),
      path = require('path'),
      chokidar = require('chokidar');
      //alwaysalive = require("alwaysalive"); 

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
            
        //Mapping controllers diretories
        if(typeof stg.map === "object"){
            if(stg.dev)
                console.info("Organized: mapping controllers diretories");
            
            let _this = this;
            
            for(let key in stg.map){
                if(fs.lstatSync(stg.map[key]).isDirectory()){
                    let watcher = chokidar.watch(stg.map[key] + "/*", {ignored: /[\/\\]\./, persistent: true});
        
                    watcher.on('ready', (event, filename) => {
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
                    
                    /*alwaysalive.watch(stg.map[key]+"/*", {ignored: /[\/\\]\./, persistent: true}, false, (event, filename) => {
                        let argsArr = [];

                        for(let keyArgs in _this.stgs.map_args)
                            argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);
            
                        if(stg.dev)
                            console.info("Organized: loading " + filename);
                            
                        delete require.cache[path.resolve(filename)];
                        var obj = module.require(filename);
                    
                        if(typeof obj === "function")
                            obj.apply(this, argsArr);
                    });*/
                }
                else{
                    let watcher = chokidar.watch(stg.map[key], {ignored: /[\/\\]\./, persistent: true});
        
                    watcher.on('ready', (event, filename) => {
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
                    
                    /*alwaysalive.watch(stg.map[key], {ignored: /[\/\\]\./, persistent: true}, false, (event, filename) => {
                        let argsArr = [];

                        for(let keyArgs in _this.stgs.map_args)
                            argsArr.push(_this.args[_this.stgs.map_args[keyArgs]]);
                        
                        if(stg.dev)
                            console.info("Organized: loading " + filename);
                        
                        delete require.cache[path.resolve(filename)];
                        var obj = module.require(filename);
                    
                        if(typeof obj === "function")
                            obj.apply(this, argsArr);
                    });*/
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
