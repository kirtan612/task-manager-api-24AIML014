const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        minlength: [3, 'Title must be at least 3 characters long']
    },
    description: {
        type: String
    },
    
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: `'{VALUE}' is not supported`
        },
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.pre('save', function () {
    if (this.title) {
        this.title = this.title.trim();
    }
});

module.exports = mongoose.model('Task', taskSchema);
