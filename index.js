const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
require('dotenv').config()
const mongoose = require('mongoose')

const Shelter = require('./models/shelter')
const Animal = require('./models/animal')

//const bodyParser = require('body-parser')
//const middleware = require('./utils/middleware')
/*
app.use(cors())
app.use(bodyParser.json())

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)
*/

mongoose.set('useFindAndModify', false)
const mongo_url = process.env.MONGODB_URI

mongoose.connect(mongo_url, { useNewUrlParser: true })
    .then(result => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log('Error with connection to MongoDB: ', error.messsage)
    })


const typeDefs = gql`
    type Coordinates {
        longitude: Float
        latitude: Float
    }
    type Address {
        street: String!
        city: String!
        postcode: String!
        county: String!
    }
    type Shelter {
        name: String!
        address: Address!
        telephone: String
        website: String
        coordinates: Coordinates!
        animals: [Animal]!
        id: ID!
    }
    type Animal {
        name: String!
        type: String!
        breed: String!
        age: String!
        description: String
        image: String
        id: ID!
        shelter: Shelter!
    }
    type Query {
        allShelters: [Shelter!]!
        allAnimals: [Animal!]!
    }
    type Mutation {
        addShelter(
            name: String!
            street: String!
            city: String!
            postcode: String!
            county: String!
            telephone: String
            website: String
            longitude: Float
            latitude: Float
        ): Shelter
        addAnimal(
            name: String!
            type: String!
            breed: String!
            age: String!
            description: String
            image: String,
            shelter: String!
        ): Animal
    }
`

const resolvers = {
    Query: {
        allShelters: () => Shelter.find({}).populate('animals'),
        allAnimals: () => Animal.find({}).populate('shelter')
    },
    Shelter: {
        address: root => {
            return {
                street: root.street,
                city: root.city,
                postcode: root.postcode,
                county: root.county
            }
        },
        coordinates: root => {
            return {
                longitude: root.longitude,
                latitude: root. latitude
            }
        }
    },
    Mutation: {
        addShelter: async (root, args) => {
            const shelter = new Shelter({ ...args })
            try {
                await shelter.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return shelter
        },
        addAnimal: async (root, args) => {
            const animal = new Animal({ ...args })
            try {
                await animal.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return animal
        }
    }
}


const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
