var request = require('request-promise');
var cheerio = require('cheerio');
var q = require('bluebird');
var firebase = require('../firebase-module');

/* Custom scraping logic for UBC's course directory. */
function start() {
    console.log('Scraping...');
    request('https://courses.students.ubc.ca/cs/main?pname=subjarea', function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var subjectTable = $('#mainTable').find('tbody').find('tr');
            var subjects = [];
            subjectTable.each(function(i, element) {
                var row = $(this).children().first();
                var subject = row.find('a');
                if (subject.length !== 0) {
                    subjects.push(subject.text());
                }
            });

            // navigate to each subject's course list and grab
            // the list of courses
            var subjectUrl = "https://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=1&dept=";
            var courseRequests = [];
            for (var i = 0; i < subjects.length; i++) {
                var courseRequest = request({
                    uri: subjectUrl + subjects[i],
                    transform: function(body) {
                        return cheerio.load(body);
                    }
                }).then(subjectHandler);
                courseRequests.push(courseRequest);
            }

            q.all(courseRequests).then(function(results) {
                var courses = [].concat.apply([], results);
                firebase.saveCourses("ubc", courses);
            })
        }
    });
}

function subjectHandler($) {
    var courses = [];
    var courseTable = $('#mainTable').find('tbody').find('tr');
    courseTable.each(function(i, element) {
        var row = $(this).children().first();
        var course = row.find('a');
        if (course.length !== 0) {
            courses.push(course.text());
        }
    });
    return courses;
}

module.exports.start = start;
