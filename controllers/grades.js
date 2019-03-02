const Grades = require('../models/Grades');

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
        }
        else {
            grades = new Grades({
                studentId: req.body.studentId,
                grades: req.body.grades,
                absences: req.body.absences
            });
        }
        grades.save(errors => {
            if(errors) {
                return res.status(400).json(errors);
            }
            return res.status(201).json( { message: 'Success' } );
        });
    });
};

// GET /grades/all
exports.getAll = (req, res) => {
    if(!req.query.studentId) {
        return res.status(422).json( { message: 'Invalid Student' } );
    }
    Grades.findOne( { studentId: req.body.studentId } , function (errors, grades) {
        if(errors) {
            return res.status(400).json(errors);
        }
        return res.status(200).json(grades);
    });
};