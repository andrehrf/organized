# Organized

Organizer and optimizer Node.js applications using AMD and Require.js concepts

## Install

```bash
$ npm install organized
```

## Usage

Set bootstrap

```js
'use strict';

var app = require("organized");

app.config({
    modules: {//Defines modules
        optimist: "optimist",
        cluster: "cluster",
        express: "express"
    },
    virtual: {//Virtual variables
        dirname: "__dirname",
        app: "express()",
        argv: "optimist.argv"
    },
    map: [`${__dirname}/controllers`],//Mapping directories
    map_args: ["dirname", "app"]//Arguments that will be passed to the scripts
});

app.init(["app", "argv", "cluster", "express"], function(app, argv, cluster, express){
    if(cluster.isMaster){//Create cluster
        for(var i = 0; i < require('os').cpus().length; i++)
            cluster.fork();

        cluster.on('exit', function *(worker){
            console.log(`Worker ${worker.id} died :(`);
            cluster.fork();
        });
    }
    else{//Start Express Server
        const port = (typeof argv.port === "number") ? argv.port : 3000;
        app.use(express.static("public", {maxage: "2h"}));
        app.listen(port, function(){
            console.log(`Example app listening on port ${port}!`);
        });
    }
});
```

## Create controller

To set the directory to map all scripts will automatically load

controllers/routes.js
```js
module.exports = function(dirname, app){
    app.get("/", function(req, res){ 
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