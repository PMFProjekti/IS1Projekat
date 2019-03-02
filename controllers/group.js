const User = require('../models/User');
const Group = require('../models/Group');

function getMentor(mentorId) {
    return new Promise((resolve, reject) => {
        User.findById(mentorId, (errors, user) => {
            if(errors) {
                return reject(errors);
            }
            return resolve(user);
        });
    });
} 

function getGroupUserData(ids) {
    let promises = [];
    for(let i=0; i < ids.length; i++) {
        promises.push(new Promise((resolve, reject) => {
            User.findById(ids[i], (errors, user) => {
                if(errors) {
                    return reject(errors);
                }
                let avatar = user.avatar(60);
                let foundUser = {
                    id: user._id,
                    email: user.email,
                    name: user.profile.name,
                    gender: user.profile.gender,
                    avatar
                }
                return resolve(foundUser);
            });
        }));
    }
    return Promise.all(promises);
} 

function getGroupData(mentorId, studentIds) {
    return Promise.all([getMentor(mentorId), getGroupUserData(studentIds)]);
}

// POST /group/create
exports.postCreate = (req, res, next) => {
    console.log(req.body);
    if (!req.body.mentor) {
        return res.status(422).json('Invalid Mentor.');
    }
    req.assert('name', "Invalid Name, has to be at least 2 characters long.").len(2);
    req.assert('year', "Invalid Year, has to be number between 1 and 8");
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).json(errors);
    }
    const group = new Group({
        name: req.body.name,
        year: req.body.year,
        mentor: req.body.mentor
    });
    group.save((errors) => {
        if (errors) { 
            return res.status(400).json(errors);
        }
        return res.status(201).json( { message: 'Success' } );
    });
};

// GET /group/find
exports.getFind = (req, res) => {
    if(!req.query.id) {
        return res.status(422).json('Invalid group id');
    }
    Group.findById(req.query.id, (errors, group) => {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(!group) {
            return res.status(404).json('Not Found');
        }
        let foundGroup = {
            id: group._id,
            name: group.name,
            year: group.year,
            mentor: group.mentor
        };
        return res.status(200).json(foundGroup);
    });
};

// GET /group/all
exports.getAll = (req, res) => {
    Group.find({}, function (err, groups) {
        let promises = [];
        let allGroups = groups.map(group => {
            return {
                id: group._id,
                name: group.name,
                year: group.year,
                mentor: group.mentor
            }
        });
        groups.forEach((group) => promises.push(getGroupData(group.mentor, group.students)));
        Promise.all(promises).then((data) => {
            let newGroups = [];
            for(let i in allGroups) {
                let mentor = data[i][0];
                let students = data[i][1];
                let avatar = mentor.avatar(60);
                newGroups.push({
                    id: allGroups[i].id,
                    name: allGroups[i].name,
                    year: allGroups[i].year,
                    students: students,
                    mentor: {
                        id: mentor._id,
                        email: mentor.email,
                        name: mentor.profile.name,
                        gender: mentor.profile.gender,
                        avatar
                    }
                });
            }
            return res.status(200).json(newGroups);
        });
    });
};

exports.putAddStudent = (req, res) => {
    if(!req.body.groupId) {
        return res.status(422).json({ message: 'Invalid Group Id' });
    }
    if(!req.body.studentId) {
        return res.status(422).json({ message: 'Invalid Group Id' });
    }
    Group.findById(req.body.groupId, async function (errors, group) {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(!group) {
            return res.status(404).json({ message: 'Group Not Found' });
        }
        User.findById(req.body.studentId, (errors, user) => {
            if(errors) {
                return res.status(400).json(errors);
            }
            if(!user) {
                return res.status(404).json({ message: 'User Not Found' });
            }
            group.students.push(req.body.studentId);
            group.save((error) => {
                if(error) {
                    return res.status(400).json(error);
                }
                return res.status(200).json({ message: 'Success' });
            });
        });
    });
};

exports.putRemoveStudent = (req, res) => {
    if(!req.body.groupId) {
        return res.status(422).json({ message: 'Invalid Group Id' });
    }
    if(!req.body.studentId) {
        return res.status(422).json({ message: 'Invalid Group Id' });
    }
    Group.findById(req.body.groupId, async function (errors, group) {
        if(errors) {
            return res.status(400).json(errors);
        }
        if(!group) {
            return res.status(404).json({ message: 'Group Not Found' });
        }
        User.findById(req.body.studentId, (errors, user) => {
            if(errors) {
                return res.status(400).json(errors);
            }
            if(!user) {
                return res.status(404).json({ message: 'User Not Found' });
            }
            group.students.splice(group.students.indexOf(req.body.studentId));
            group.save((error) => {
                if(error) {
                    return res.status(400).json(error);
                }
                return res.status(200).json({ message: 'Success' });
            });
        });
    });
};

