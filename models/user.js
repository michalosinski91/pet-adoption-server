const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 5,
        unique: true
    },
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true
    },
    password: String,
    shelter: String,
    permissions: [
        {
            type: String
        }
    ]

})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)