const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description:{
        type: String,
        unique: true,
        maxlength: 25,
        trim: true,
        required: true
    },
    completed:{
        type: Boolean,
        default: false
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})
const Task = new mongoose.model('Task', taskSchema);

const allowedUpdates = ['description', 'completed'];

module.exports = {
    Task,
    allowedUpdates
};