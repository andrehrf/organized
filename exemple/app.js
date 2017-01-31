/**
 * Application example
 * 
 * @author André Ferreira <andrehrf@gmail.com>
 */

"use strict";

let define = require("../index.js").load;
   
define({ 
    express: "express", 
    passport: "passport",
    dirname: () => { return __dirname; },  
    env: () => { return process.env.NODE_ENV || "dev"; },
    app: (express) => { return express(); },
    MongoStore: () => { return require('connect-mongo')(require('express-session')); },
    settings: () => {
        return {
            dev: {mongodb: "mongodb://localhost:27017/test"},
            prod: {mongodb: "mongodb://myserver:27017/test"}
        };
    }
}, {    
    provider: (app, passport, MongoStore, settings, env) => {
        app.set('views', __dirname + '/public');
        app.set('view engine', 'ejs');
        app.use(require('serve-static')(__dirname + '/public'));
        app.use(require('cookie-parser')());
        app.use(require('body-parser').urlencoded({ extended: true }));
        app.use(require('body-parser').json());
        app.use(require('express-session')({saveUninitialized: true, resave: true, secret: process.env.SECRET || "secret", store: new MongoStore({url: settings[env].mongodb})}));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(require("connect-flash")());
        return true;
    },
    services: [(_this, settings, app, env) => {  
        let mongodb = require("mongodb").MongoClient;
        mongodb.connect(settings[env].mongodb, (err, db) => {
            _this.set("mongodb", db);
        });

        return true;
    }],
    map: [`${__dirname}/src/*.js`], //Mapping controllers diretory
    scope: (app, provider, services, mongodb) => { 
        app.listen(process.env.PORT || 8080, () => {
            console.log("server on");
        });
    }
}, { require: require });
      
      
