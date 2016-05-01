/* 
 * Example of use of the Organized
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const app = require("./index.js");

app.config({//Defining directory self loading scripts
    modules: {
        optimist: "optimist",
        cluster: "cluster",
        express: "express"
    },
    virtual: {
        dirname: "__dirname",
        app: "express()",
        argv: "optimist.argv"
    },
    map: [`${__dirname}/controllers`],
    map_args: ["dirname", "app"]
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
    else{
        const port = (typeof argv.port === "number") ? argv.port : 3000;
        app.use(express.static("public", {maxage: "2h"}));
        app.listen(port, function(){
            console.log(`Example app listening on port ${port}!`);
        });
    }
});