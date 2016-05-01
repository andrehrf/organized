'use strict';

const rd = require("require-directory");

class Organized {
    constructor() {
        this.args = {};
    }
    
    set(key, value){
        this.args[key] = value;
    }
    
    config(stg = {}){        
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
}

module.exports = new Organized;
