const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
{
    name: String,
    year: Number,
    mentor: String,
    students: [String]
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;