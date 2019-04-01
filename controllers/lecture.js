const Lecture = require('../models/Lecture');
const GroupController = require('./group');

// POST /lecture/connect
exports.postConnect = (req, res, next) => {
    if(!req.body.groupId) {
        return res.status(422).json( { message: 'Invalid Group' } );
    }
    if(!req.body.subjectId) {
        return res.status(422).json( { message: 'Invalid Subject' } );
    }
    if(!req.body.professorId) {
        return res.status(422).json( { message: 'Invalid Professor' } );
    }
    Lecture.findOne( { groupId: req.body.groupId, subjectId: req.body.subjectId }, function (errors, lecture) {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(lecture) {
            lecture.professorId = req.body.professorId;
        }
        else {
            lecture = new Lecture({
                groupId: req.body.groupId,
                subjectId: req.body.subjectId,
                professorId: req.body.professorId
            });
        }
        lecture.save(errors => {
            if(errors) {
                return res.status(400).json(errors);
            }
            return res.status(201).json( { message: 'Success' } );
        });
    });
};

// GET /lecture/access
exports.getGradeAllowed = (req, res) => {
    if(!req.query.studentId) {
        return res.status(422).json( { message: 'Invalid Student' } );
    }
    if(!req.query.subjectId) {
        return res.status(422).json( { message: 'Invalid Subject' } );
    }
    if(!req.query.professorId) {
        return res.status(422).json( { message: 'Invalid Professor' } );
    }
    return GroupController.getStudentGroup(req.query.studentId)
    .then(group => {
        Lecture.findOne( { groupId: group.id, subjectId: req.query.subjectId }, function (errors, lecture) {
            if(errors) {
                return res.status(400).json(errors);
            }
            if(!lecture) {
                return res.status(200).json({ allowed: false });
            }
            if(lecture.professorId == req.query.professorId) {
                return res.status(200).json({ allowed: true });
            }
            return res.status(200).json({ allowed: false });
        });
    })
    .catch(error => res.status(400).json(error));
};

// GET /lecture/all
exports.getAll = (req, res) => {
    Lecture.find({}, async function (err, lectures) {
        let allLectures = lectures.map(lecture => {
            return {
                id: lecture._id,
                groupId: lecture.groupId,
                subjectId: lecture.subjectId,
                professorId: lecture.professorId
            }
        });
        if(req.query.professorId) {
            allLectures = allLectures.filter(lecture => lecture.professorId == req.query.professorId);
        }
        if(req.query.groupId) {
            allLectures = allLectures.filter(lecture => lecture.groupId == req.query.groupId);
        }
        return res.status(200).json(allLectures);
    });
};