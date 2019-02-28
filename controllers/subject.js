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

// GET /subject/all
exports.getAll = (req, res) => {
    Subject.find({}, async function (err, subjects) {
        let promises = [];
        let allSubjects = subjects.map(subject => {
            return {
                id: subject._id,
                name: subject.name,
                year: subject.year
            }
        });
        if(req.query.year) {
            allSubjects = allSubjects.filter(subject => subject.year == req.query.year);
        }
        return res.status(200).json(allSubjects);
    });
};