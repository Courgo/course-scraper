var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var firebaseModule = require('./firebase-module');

var routes = require('./routes/index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    console.log('Starting in development environment.');
    firebaseModule.initialize("./credential-dev.json", "https://courgo-dev.firebaseio.com/");
    firebaseModule.getStatistics();
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    console.log('Starting in production environment.');
    firebaseModule.initialize("./credential-prod.json", "https://courgo-prod.firebaseio.com/");
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var args = process.argv;
if (args.length <= 2) {
    console.log("No arguments provided in the form: 'scrape|scrapemeta' [university]");
    process.exit(0);
} else {
    var action = args[2];
    if (action === 'scrape' || action === 'scrapemeta') {
        if (args.length > 3) {
            var university = args[3];
            try {
                var universityScraper = require('./routes/' + university);
                if (action === 'scrape') {
                    universityScraper.start();
                } else if (action === 'scrapemeta') {
                    universityScraper.getCourseMetadata();
                }
            } catch (err) {
                console.log(err);
                console.log("University key: "+ university + " is not recognized.");
                process.exit(0);
            }
        } else {
            console.log("Need additional argument: 'university'.");
            process.exit(0);
        }
    } else {
        console.log("Invalid action.");
        process.exit(0);
    }
}

module.exports = app;
