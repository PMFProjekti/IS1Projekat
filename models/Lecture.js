const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
{
    groupId: String,
    subjectId: String,
    professorId: String
});

const Lecture = mongoose.model('Lecture', lectureSchema);

module.exports = Lecture;