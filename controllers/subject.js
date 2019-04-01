const Group = require('../models/Group');
const group = require('./group');
const Subject = require('../models/Subject');

// POST /subject/create
exports.postCreate = (req, res, next) => {
    req.assert('name', "Invalid Name, has to be at least 6 characters long.").len(6);
    req.assert('year', "Invalid Year, has to be number between 1 and 8");
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    const subject = new Subject({
        name: req.body.name,
        year: req.body.year
    });
    subject.save((errors) => {
        if (errors) { 
            return res.status(400).json(errors);
        }
        return res.status(201).json( { message: 'Success' } );
    });
};

let listSubjects = (year) => {
    return new Promise((resolve, reject) => {
        Subject.find({}, async function (error, subjects) {
            if(error) {
                return reject(error);
            }
            let allSubjects = subjects.map(subject => {
                return {
                    id: subject._id,
                    name: subject.name,
                    year: subject.year
                }
            });
            if(year) {
                allSubjects = allSubjects.filter(subject => subject.year == year);
            }
            return resolve(allSubjects);
        });
    });
}

let findSubjects = (params) => {
    return new Promise((resolve, reject) => {
        if(params.groupId) {
            Group.findById(params.groupId, (errors, group) => {
                if(errors) {
                    return reject(errors);
                }
                if(!group) {
                    return reject({message:'Group Not Found'});
                }
                return listSubjects(group.year)
                .then(subjects => resolve(subjects))
                .catch(error => reject(error));
            });
        }
        else if(params.studentId) {
            return group.getStudentGroup(params.studentId)
            .then(group => {
                return listSubjects(group.year)
                .then(subjects => resolve(subjects))
                .catch(error => reject(error));
            })
            .catch(error => reject(error));
        }
        else
        {
            return listSubjects(group.year)
                .then(subjects => resolve(subjects))
                .catch(error => reject(error));
        }
    });
}

exports.listSubjects = listSubjects;
exports.findSubjects = findSubjects;

// GET /subject/all
exports.getAll = (req, res) => {
    findSubjects(req.query)
    .then(subjects => res.status(201).json(subjects))
    .catch(error => res.status(400).json(error))
};