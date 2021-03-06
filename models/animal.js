const mongoose = require('mongoose')

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
    },
    type: {
        type: String,
        required: true,
        minlength: 3
    },
    breed: {
        type: String,
        required: true,
        minlength: 1
    },
    age: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        required: true
    },
    shelter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shelter'
    }
})

module.exports = mongoose.model('Animal', animalSchema)