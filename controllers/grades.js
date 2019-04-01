const User = require('../models/User');
const Group = require('../models/Group');
const Grades = require('../models/Grades');
const SubjectController = require('./subject');

let createGrades = (studentId) => {
    return new Promise((resolve, reject) => {
        SubjectController.findSubjects({studentId:studentId})
        .then(subjects => {
            let subjectGrades = subjects.map(subject => 
                {
                     return {
                        subjectId: subject.id,
                        values: [],
                        locked: 0
                    }
                });
            let newGrades = new Grades({ studentId: studentId });
            newGrades.grades = subjectGrades;
            newGrades.absences = [];
            resolve(newGrades);
        })
        .catch(error => reject(error));
    });
} 
// POST /grades/update
exports.postUpdate = (req, res, next) => {
    if(!req.body.studentId) {
        return res.status(422).json( { message: 'Invalid Student' } );
    }
    Grades.findOne( { studentId: req.body.studentId }, function (errors, grades) {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(grades) {
            grades.grades = req.body.grades;
            grades.absences = req.body.absences;
            grades.save(errors => {
                if(errors) {
                    return res.status(400).json(errors);
                }
                return res.status(201).json( { message: 'Success' } );
            });
        }
        else {
            createGrades(req.body.studentId)
            .then(newGrades => {
                newGrades.grades = req.body.grades;
                newGrades.absences = req.body.absences;
                newGrades.save(errors => {
                    if(errors) {
                        return res.status(400).json(errors);
                    }
                    return res.status(201).json( { message: 'Success' } );
                });
            })
            .catch(error => res.status(400).json(error));
        }
    });
};

// GET /grades/all
exports.getAll = (req, res) => {
    if(!req.query.studentId) {
        return res.status(422).json( { message: 'Invalid Student' } );
    }
    Grades.findOne( { studentId: req.query.studentId } , function (errors, grades) {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(!grades) {
            return createGrades(req.query.studentId)
            .then(newGrades => {
                newGrades.save(errors => {
                    if(errors) {
                        return res.status(400).json(errors);
                    }
                    return res.status(201).json(newGrades);
                });
            })
            .catch(error => res.status(400).json(error));
        }
        else return res.status(200).json(grades);
    });
};