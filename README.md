# lambdeploy

A package for creating AWS lambda functions which build and deploy
statically-generated websites.

    npm install lambdeploy --save

Example *index.js*

    var lambdeploy = require('lambdeploy');
    var fs = require('fs');
    var path = require('path');
    exports.handler = lambdeploy.createHandler(function(workingDir, callback) {
        var buildDir = path.join(workingDir, 'build');
        fs.writeFile(path.join(buildDir, 'index.html'), 'Hello world\n', function(err) {
	    callback(err, buildDir);
	});
    });

The `createHandler` function turns a "build function" into a handler function
which can be used to make an AWS lambda. A build function a function which takes
a working directory and a callback, builds something and calls the provided
callback function with either an error or the directory which contains the
output of the build.