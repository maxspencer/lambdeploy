exports.createHandler = function(buildFunction) {
    return function(event, context, callback) {
	const fs = require('fs');
	const tar = require('tar');
	const zlib = require('zlib');
	const https = require('follow-redirects').https;
	const AWS = require('aws-sdk');
	const path = require('path');
	const url = require('url');
	const s3 = require('s3');
	const yaml = require('yaml-js');

	// Some constants
	const userAgent = 'lambdeploy';
	const archiveFormat = 'tarball';
	const configFilePath = '.lambdeploy.yml'
	
	var download = function(host, path, dest, cb) {
	    var options = {
		host: host,
		path: path,
		headers: {
		    'User-Agent': userAgent
		}
	    }
	    var request = https.get(options, function(response) {
		var decompress = zlib.createGunzip()
		    .on('error', function(err) {
			callback(err);
		    });
		var extractor = tar.Extract({path: dest})
		    .on('error', function(err) { callback(err); })
		    .on('end', cb);
		response
		    .pipe(decompress)
		    .pipe(extractor);
	    }).on('error', function(err) {
		if (cb) cb(err.message);
	    });
	};

	var message = JSON.parse(event.Records[0].Sns.Message);
	console.log('Message: ' + JSON.stringify(message, null, 2));

	if (message.pusher === undefined) {
	    console.log('Not a push event, no build triggered');
	    callback(null, 'No build');
	    return;
	}

	var archiveUrl = url.parse(
	    message.repository.archive_url
		.replace('{archive_format}', archiveFormat)
		.replace('{/ref}', '/' + message.ref)
	);
	console.log('Archive URL is ' + url.format(archiveUrl));
	
	var tmpDir = path.join('/tmp', message.repository.name + '-' + message.after);
	console.log('Download directory is ' + tmpDir);    
	
	download(archiveUrl.host, archiveUrl.path, tmpDir, function(err, data) {
	    if (err) {
		callback(err);
		return;
	    }
	    var files = fs.readdirSync(tmpDir);
	    var tmpBaseDir = path.join(tmpDir, files[0]);
	    var config = yaml.load(fs.readFileSync(path.join(tmpBaseDir, configFilePath)))
	    var tmpNodeModules = path.join(tmpBaseDir, 'node_modules');
	    var packageNodeModules = path.join(process.cwd(), 'node_modules');
	    console.log('Temporary working directory is ' + tmpBaseDir);
	    fs.unlink(tmpNodeModules, function() {
		fs.symlink(packageNodeModules, tmpNodeModules, function(err) {
		    if (err) {
			callback(err);
			return;
		    }
		    console.log('Calling buildFunction...');
		    buildFunction(tmpBaseDir, function(err, buildDir) {
			if (err) {
			    callback(err);
			    return;
			}
			console.log('Generated site files in ' + buildDir);
			console.log('Uploading to S3 bucket ' + config.s3Bucket + ' in ' + config.s3Region);
			var awsS3Client = new AWS.S3({ region: config.s3Region	});
			var s3Client = s3.createClient({ s3Client: awsS3Client });
			var uploader = s3Client.uploadDir({
			    localDir: buildDir,
			    deleteRemoved: true,				
			    s3Params: {
				Bucket: config.s3Bucket,
			    },
			});
			uploader.on('error', function(err) {
			    console.error("Unable to upload to s3: ", err.stack);
			    callback(err);
			});
			uploader.on('end', function() {
			    callback(null, "Uploaded to s3");
			});
		    });
		});
	    });
	});
    }
}
