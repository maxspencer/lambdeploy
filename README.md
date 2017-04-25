# lambdeploy

A package for creating AWS lambda functions which build and deploy
statically-generated websites.

    npm install lambdeploy --save

Example *index.js*

    var lambdeploy = require('lambdeploy');
    var fs = require('fs');
    var path = require('path');
    exports.handler = lambdeploy.createHandler(function(workingDir, callback) {
        fs.writeFile(path.join(workingDir, 'index.html'), 'Hello world\n', callback);
    });