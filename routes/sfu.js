var express = require('express');
var router = express.Router();
var request = require('request-promise');
var cheerio = require('cheerio');
var q = require('bluebird');
var firebase = require('../firebase-module');

/* Custom scraping logic for SFU's course directory. */
router.get('/', function(req, res, next) {
    request('https://www.sfu.ca/students/calendar/2016/summer/courses.html', function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var alphabetTable = $('.course-finder').find('ul');
            var subjectUrls = [];
            alphabetTable.each(function(i, element) {
                var subjects = $(this).find('li').find('a');
                subjects.each(function(i, element) {
                    var subjectUrl = $(this).attr('href');
                    if (subjectUrl[0] !== '#') { // filters hrefs that start with '#'
                        subjectUrls.push(subjectUrl);
                    }
                });
            });

            // navigate to each subject's course list and grab
            // the list of courses
            var sfuBaseUrl = 'https://www.sfu.ca';
            var courseRequests = [];
            for (var i = 0; i < subjectUrls.length; i++) {
                var courseRequest = request({
                    uri: sfuBaseUrl + subjectUrls[i],
                    transform: function(body) {
                        return cheerio.load(body);
                    }
                }).then(subjectHandler);
                courseRequests.push(courseRequest);
            }

            q.all(courseRequests).then(function(results) {
                var courses = [].concat.apply([], results);
                firebase.saveCourses("sfu", courses, res);
            })
        }
    });
});

function subjectHandler($) {
    var courses = [];
    var courseTable = $('.main').find('h3').find('a');
    courseTable.each(function(i, element) {
        var course = $(this).text();
        courses.push(course);
    });
    return courses;
}

module.exports = router;
