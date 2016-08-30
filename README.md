# Organized

Organizer and optimizer Node.js applications using AMD and Require.js concepts

## Install

```bash
$ npm install organized
```

## Usage

Set bootstrap

```js
"use strict";

let fs = require("fs"),
    cluster = require("cluster"),
    app = require("organized"),
    alwaysalive = require("alwaysalive"),
    env = process.env.NODE_ENV || "dev";

process.on('uncaughtException', function(err){ console.log(err); });
if(cluster.isMaster){//Create cluster
    const cpus = (env !== "dev") ? require('os').cpus().length : 1; 

    for(var i = 0; i < cpus; i++)
        cluster.fork();

    cluster.on('exit', (worker) => {
        cluster.fork();
    }); 
}
else{  
    let serverHTTP = null,
    servetHTTPS = null; 
          
    alwaysalive.watch(`${__dirname}/app.js`, {ignored: /[\/\\]\./, persistent: true}, (event, path) => {    
        app.config({
            dev: false,    
            modules: { //Require modules
                settings: `${__dirname}/settings.json`,
                optimist: "optimist",
                cluster: "cluster",
                express: "express", 
                i18n: "i18n",
                MongoDBServer: "mongoskin",
                passport: "passport"
            },
            virtual: { //Settings virtual services 
                dirname: `"${__dirname}"`,  
                app: "express()",
                argv: "optimist.argv",
                MongoStore: "require('connect-mongo')(require('express-session'))",
                mongodb: `MongoDBServer.db(settings['${env}'].mongodb, {native_parser:true})`
            },
            preload_args: ["settings", "app", "passport", "MongoStore"],
            preload: (settings, app, passport, MongoStore) => {//Preload settings
                if(env == "dev"){
                    app.use(require('morgan')("combined"));//Express debug requests

                    app.set('etag', false); 
                    app.use((req, res, next) => {//No Cache
                        res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                        next();
                    });
                }
                else{                
                    app.use((req, res, next) => {//Cache
                        res.setHeader("Cache-Control", "public, max-age=300");
                        res.setHeader("Expires", new Date(Date.now() + 300000).toUTCString());
                        next();
                    });

                    app.use('/*', (req, res, next) => {//Remove WWW And Force SSL
                        if(req.headers.host.match(/^www/) !== null)
                            res.redirect('https://' + req.headers.host.replace(/^www\./, '') + req.url);
                        else if(req.protocol === "http" && argv.local !== "true" && req.hostname !== "localhost")
                            res.redirect('https://' + req.headers.host + req.url);
                        else
                            next();     
                    });
                }

                app.set('views', __dirname + '/public');
                app.set('view engine', 'ejs');
                //app.use(i18n.init); 
                //app.use(require('compression')());
                app.use(require('serve-static')(__dirname + '/public'));
                app.use(require('cookie-parser')());
                app.use(require('body-parser').urlencoded({ extended: true }));
                app.use(require('body-parser').json());
                app.use(require('express-session')({saveUninitialized: true, resave: true, secret: settings[env].session.secret, store: new MongoStore({url: settings[env].mongodb})}));
                app.use(passport.initialize());
                app.use(passport.session());
                app.use(require("connect-flash")());

                if(event == "change"){
                    var routes = app._router.stack;
                    routes.forEach(removeMiddlewares);
                    function removeMiddlewares(route, i, routes) {
                        routes.splice(i, 1);

                        if (route.route)
                            route.route.stack.forEach(removeMiddlewares);
                    }
                }
            },
            map_args: ["settings", "dirname", "argv", "app", "passport", "mongodb"],
            map: [`${__dirname}/src`], //Mapping controllers diretory
            bootstrap_args: ["settings", "argv", "cluster", "app", "passport"],
            bootstrap: (settings, argv, cluster, app, passport) => { //Start application
                if(event == "change" && cluster.isWorker)
                    process.exit(1);

                const port = (typeof argv.port === "number") ? argv.port : settings[env].port;

                if(env !== "dev"){ 
                    if(serverHTTP)
                        serverHTTP.close();

                    serverHTTP = app.listen(port);

                    //HTTPS
                    const portSSL = (typeof argv.port === "number") ? argv.portssl : settings[env].portSSL;
                    const https = require('https'),
                          sts = require('strict-transport-security');

                    var httpsServer = https.createServer({
                        passphrase: settings[env].ssl.passphrase,
                        secureProtocol: 'SSLv23_method',
                        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
                        honorCipherOrder: true,
                        SNICallback: function (domain, cb) { 
                            var ctx = tls.createSecureContext({
                                ca: fs.readFileSync(`/etc/letsencrypt/live/${domain}/chain.pem`),                    
                                key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
                                cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/cert.pem`),
                                passphrase: passphrase
                            });

                            if(cb)
                                cb(null, ctx);
                            else
                                return ctx;
                        }
                    }, app);

                    const globalSTS = sts.getSTS({"max-age": {days:10, includeSubDomains:true}});
                    app.use(globalSTS);

                    if(servetHTTPS)
                        servetHTTPS.close();

                    servetHTTPS = httpsServer.listen(portSSL);
                }
                else{                                      
                    if(serverHTTP)
                        serverHTTP.close();
                        serverHTTP = null;

                    serverHTTP = app.listen(port, () => { console.log("localhost"); });                                                                         
                }
            }
        });
    }, null);
}
```

## Create controller

To set the directory to map all scripts will automatically load

controllers/routes.js
```js
module.exports = (settings, dirname, argv, app, passport, mongodb) => {
    app.get("/", (req, res) => { 
        res.sendFile(`${dirname}/public/index.html`); 
    });
};
```

public/index.html
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