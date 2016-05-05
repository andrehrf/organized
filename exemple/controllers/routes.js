/**
 * Route Controller
 */

module.exports = (dirname, app) => {
    app.get("/", (req, res) => { res.sendFile(`${dirname}/public/index.html`); });
};