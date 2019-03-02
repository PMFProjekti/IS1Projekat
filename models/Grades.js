const mongoose = require('mongoose');

const gradesSchema = new mongoose.Schema(
{
    studentId: String,
    grades: Array,
    absences: Array
});

const Grades = mongoose.model('Grades', gradesSchema);

module.exports = Grades;