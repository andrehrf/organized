# Organized

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/andrehrf/organized/master/LICENSE)
[![npm version](https://badge.fury.io/js/organized.svg)](https://badge.fury.io/js/organized)

Organizer and optimizer Node.js applications using AMD and Require.js concepts

## Install

```bash
$ npm install organized
```

## Usage

```js
"use strict";

let define = require("organized").load;
   
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
    map: [`${__dirname}/src`], //Mapping controllers diretory
    scope: (app, provider, services, mongodb) => { 
        app.listen(process.env.PORT || 8080, () => {
            console.log("server on");
        });
    }
}, { require: require });
```

## Create controller

To set the directory to map all scripts will automatically load

src/routing.js
```js
module.exports = (app) => {
    app.get("/", (req, res) => { 
        res.render("index"); 
    });
};
```

public/index.ejs
```html
<!DOCTYPE html>
<html>
    <head>
        <title>Hello World</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div>Hello World</div>
    </body>
</html>
```

## Starting application

Organizer uses Javascript ES6 so the --harmony parameter if Node.js is less than version 6 is required

Node.js 6
```bash
$ node app.js
```

Node.js other versions
```bash
$ node --harmony app.js
```

## License

  MIT
  
  Copyright (C) 2016 André Ferreira

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.