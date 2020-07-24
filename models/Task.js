const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    insID: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    origImage: {
        type: String,
        required: true
    },
    editImage: {
        type: String,
        required: false
    },
    score: {
        type: Number,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;