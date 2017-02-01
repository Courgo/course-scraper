'use strict';

var admin = require('firebase-admin');

var firebaseApp;

function initialize(pathToCredentials, dbUrl) {
    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(require(pathToCredentials)),
        databaseURL: dbUrl
    });
    module.exports.firebaseDb = firebaseApp.database();
}
module.exports.initialize = initialize;

function saveCourses(universityVal, courses, res) {
    if (!firebaseApp) {
        console.log('Firebase app has not been initialized yet.');
        return;
    }
    var coursesRef = firebaseApp.database().ref('courses');
    coursesRef
        .orderByChild('university')
        .equalTo(universityVal)
        .once('value')
        .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                var courseName = childSnapshot.val().course_name;
                // remove all courses from the local course array that have
                // already been saved to the database.
                var courseHasBeenAdded = courses.includes(courseName);
                if (courseHasBeenAdded) {
                    var index = courses.indexOf(courseName);
                    if (index > -1) {
                        courses.splice(index, 1);
                    }
                }
            });
            // save remaining courses to the database
            for (var i = 0; i < courses.length; i++) {
                var newCourseRef = coursesRef.push();
                newCourseRef.set({
                    course_name: courses[i],
                    university: universityVal
                });
            }
            res.json({
                "success": true
            });
        });
}
module.exports.saveCourses = saveCourses;
