const mongoose = require('mongoose')

const shelterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 4
    },
    street: {
        type: String,
        required: true,
        minlength: 4
    },
    city: {
        type: String,
        required: true,
        minlength: 3
    },
    postcode: {
        type: String,
        required: true,
        minlength: 4
    },
    county: {
        type: String,
        required: true,
        minlength: 5
    },
    telephone: {
        type: String,
        required: true,
        minlength: 8
    },
    website: {
        type: String
    },
    longitude: {
        type: Number
    },
    latitude: {
        type: Number
    },
    animals: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Animal'
        }
    ],
    /*administrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }*/
    
})

module.exports = mongoose.model('Shelter', shelterSchema)