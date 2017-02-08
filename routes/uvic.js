var express = require('express');
var router = express.Router();
var request = require('request-promise');
var cheerio = require('cheerio');
var q = require('bluebird');
var firebase = require('../firebase-module');

/* Custom scraping logic for UVIC's course directory. */
router.get('/', function(req, res, next) {
    request('http://web.uvic.ca/calendar2017-01/courses/', function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var subjects = [];

            var tables = $('table');
            var leftTable = tables.eq(1);
            var rightTable = tables.eq(2);

            var subjectTable = leftTable.children();
            subjectTable.each(function(i, element) {
                if ($(this).children().length >= 2) {
                    var subject = $(this).find('a').first();
                    subjects.push(subject.text());
                }
            });

            var subjectTable = rightTable.children();
            subjectTable.each(function(i, element) {
                if ($(this).children().length >= 2) {
                    var subject = $(this).find('a').first();
                    subjects.push(subject.text());
                }
            });

            // navigate to each subject's course list and grab
            // the list of courses
            var subjectPrefixUrl = "http://web.uvic.ca/calendar2017-01/CDs/";
            var subjectPostfixUrl = "/CTs.html";
            var courseRequests = [];
            for (var i = 0; i < subjects.length; i++) {
                var subject = subjects[i];
                var courseRequest = request({
                    uri: subjectPrefixUrl + subject + subjectPostfixUrl,
                    transform: function(body) {
                        var html = cheerio.load(body);
                        return html;
                    }
                }).then(subjectHandler);
                courseRequests.push(courseRequest);
            }

            q.all(courseRequests).then(function(results) {
                var courses = [].concat.apply([], results);
                firebase.saveCourses("uvic", courses, res);
            });
        }
    });
});

function subjectHandler($) {
    var courses = [];
    var courseTable = $('tr');
    var heading = $('h1');
    var subject = heading.text().match(/\(([^)]+)\)/);
    courseTable.each(function(i, element) {
        if ($(this).children().length >= 2) {
            var course = $(this).find('a').first();
            courses.push(subject[1] + " " + course.text());
        }
    });
    return courses;
}

module.exports = router;
