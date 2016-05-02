/**
 * Build Project to ASM.js
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const app = require("../index.js");
app.build([`${__dirname}/controllers/*.js`, "app.js"], `build`);