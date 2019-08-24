const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Shelter = require('./models/shelter')
const Animal = require('./models/animal')
const User = require('./models/user')

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
    enum Permission {
        ADMIN
        MOD
        USER
    }

    type User {
        email: String!
        username: String!
        password: String!
        id: ID!
        permissions: [Permission!]!
        shelter: String
    }

    type Token {
        value: String!
    }

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
        me: User
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
        createUser(
            email: String!
            username: String!
            password: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
    }
`

const resolvers = {
    Query: {
        allShelters: () => Shelter.find({}).populate('animals'),
        allAnimals: () => Animal.find({}).populate('shelter'),
        me: (root, args, {currentUser}) => currentUser
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
                latitude: root.latitude
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
        },
        createUser: async (root, args) => {
            //hashes the password
            const password = await bcrypt.hash(args.password, 10)
            //creates a new user object
            const user = new User({ 
                email: args.email.toLowerCase(), 
                username: args.username, 
                password,
                permissions: ['USER'],
                shelter: ''
            })
            
            //saves user to database, throws error if issue encountered
            return user
                .save()
                .catch(error => {
                    throw new UserInputError(error.message, {
                        invalidArgs: args
                    })
                })
        },
        login: async (root, args) => {
            //searches user in DB by username, returns user if found, error if not
            const user = await User.findOne({ username: args.username })
            if(!user) {
                throw new UserInputError(`User ${args.username} does not exist`)
            }
            //compares password from db to one given, returns error if passwords do not match
            const valid = await bcrypt.compare(args.password, user.password)
            if (!valid) {
                throw new AuthenticationError(`Incorrect password`)
            }
            //if user exists and password matches, returns a token
            return {value: jwt.sign({ id: user.id }, process.env.SECRET, {expiresIn: '1d'})}
        }
    }
}


const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        //looks for token in the authorization header and returns it if found
        const token = req ? req.headers.authorization : null
        //if token found, it is decoded by jwt, finds a user in the DB using id stored in the token, and returns the user object
        if (token) {
            const decodedToken = jwt.verify(token, process.env.SECRET)
            const currentUser = await User.findById(decodedToken.id)
            return { currentUser} 
        }

    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
