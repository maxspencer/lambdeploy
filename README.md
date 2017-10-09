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

`lambdeploy.createHandler` takes a "build function" and returns a handler
function which is exported and used to make an AWS lambda.

The "build function" will be called with a working directory and a callback. At
runtime that working directory will contain the source files to be built. The
build function must attempt to build them and then call the callback with the
either an error, or the path of the directory containing the output of the
build. That output directory is what the lambda will deploy to an S3 bucket.

In the simple example above, the build function simply outputs "Hello world" to
build/index.html.

## Local testing

    npm install -g lambda-local
    lambda-local -l test.js -e test-event.json -t 60
