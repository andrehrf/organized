/**
 * Route Controller
 */

module.exports = function(dirname, app){
    app.get("/", function(req, res){ res.sendFile(`${dirname}/public/index.html`); });
};