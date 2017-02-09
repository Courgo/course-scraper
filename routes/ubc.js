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
module.exports.start = start;

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

function getCourseMetadata() {
    firebase.getUniverityCourses("ubc").then(function(courses) {
        var deptPrefix = 'https://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=3&dept='
        var courseNumberPrefix = '&course=';

        var courseRequests = [];
        for (var courseKey in courses) {
            var result = courses[courseKey].split(" ");
            var url = deptPrefix + result[0] + courseNumberPrefix + result[1];
            var courseRequest = request({
                uri: deptPrefix + result[0] + courseNumberPrefix + result[1],
                transform: function(body) {
                    return cheerio.load(body);
                }
            }).then(courseHandler);
            courseRequests.push(courseRequest);
        }

        q.map(courseRequests, function(courseRequest) {
            return courseRequest;
        }, {
            concurrency: 10
        }).then(function(results) {
            var courseDescriptions = [].concat.apply([], results);
            courseDescriptions.forEach(function(courseDescription) {
                console.log(courseDescription.trim());
            });
        });
    });
}
module.exports.getCourseMetadata = getCourseMetadata;

function courseHandler($) {
    var courseDescription = "";
    var courseHeading = $('h4');
    courseDescription = courseHeading.next().text();
    return courseDescription;
}
