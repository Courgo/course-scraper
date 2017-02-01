var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');

/* Start scraping. */
router.get('/', function(req, res, next) {
    request('https://courses.students.ubc.ca/cs/main?pname=subjarea', function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var subjectTable = $('#mainTable').find('tbody').find('tr');
            var subjects = [];
            subjectTable.each(function(i, element) {
                console.log($(this).text());
            });

            res.json({
                "subjects": subjects
            });
        }
    });
});

module.exports = router;
