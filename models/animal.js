const mongoose = require('mongoose')

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
    },
    type: {
        type: String,
        required: true,
        minlength: 3
    },
    breed: {
        type: String,
        required: true,
        minlength: 3
    },
    age: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String
    },
    shelter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shelter'
    }
})

module.exports = mongoose.model('Animal', animalSchema)