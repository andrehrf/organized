/**
 * Organized module application
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const fs = require('fs'),
      path = require('path'),
      rd = require('require-directory'); 

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
        
        if(typeof stg.preload === "function"){
            var argsArr = [];

            for(let keyArgs in stg.preload_args)
                argsArr.push(this.args[stg.preload_args[keyArgs]]);
            
            stg.preload.apply(this, argsArr);
        }     
                
        if(typeof stg.map === "object"){
            var argsArr = [];

            for(let keyArgs in stg.map_args)
                argsArr.push(this.args[stg.map_args[keyArgs]]);
            
            for(let key in stg.map){
                if(fs.lstatSync(stg.map[key]).isDirectory()){
                    rd(module, stg.map[key]+"/", {
                        visit: function(obj){ 
                            if(typeof obj === "object")
                                obj.apply(this, argsArr);
                        } 
                    });
                }
                else{
                    var obj = module.require(stg.map[key]);
                    
                    if(typeof obj === "function")
                        obj.apply(this, argsArr);
                }
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
