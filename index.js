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
        USER
    }

    type User {
        email: String!
        username: String!
        password: String!
        id: ID!
        permission: Permission!
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
        administrator: User
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
        findUser(id: String!): User
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
            image: String!
            shelter: String!
        ): Animal
        removeAnimal(
            id: String!
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
        updateUserEmail(
            id: String!
            email: String!
        ): User
    }
`

const resolvers = {
    Query: {
        allShelters: () => Shelter.find({}).populate('animals').populate('administrator'),
        allAnimals: () => Animal.find({}).populate('shelter'),
        me: (root, args, {currentUser}) => currentUser,
        findUser: (root, args) => User.findById(args.id)
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
            const shelter = await Shelter.findById(args.shelter)
            try {
                await animal.save()
                shelter.animals = shelter.animals.concat(animal.id)
                await shelter.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return animal
        },
        removeAnimal: async (root, args) => {
            const shelter = await Shelter.findById(args.shelter)
            try {
                shelter.animals = shelter.animals.filter(animal => animal != args.id)
                shelter.save()
                const animal = await Animal.deleteOne({ _id: args.id })
            } catch (error) {
                console.log(error)
            }
            return shelter
        },
        createUser: async (root, args) => {
            //hashes the password
            const password = await bcrypt.hash(args.password, 10)
            //creates a new user object
            const user = new User({ 
                email: args.email.toLowerCase(), 
                username: args.username, 
                password,
                permission: 'USER',
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
                throw new UserInputError(`Użytkownik ${args.username} nie istnieje`)
            }
            //compares password from db to one given, returns error if passwords do not match
            const valid = await bcrypt.compare(args.password, user.password)
            if (!valid) {
                throw new AuthenticationError(`Incorrect password`)
            }
            //if user exists and password matches, returns a token
            return {value: jwt.sign({ id: user.id }, process.env.SECRET, {expiresIn: '1d'})}
        },
        updateUserEmail: async (root, args, context) => {
            const user = await User.findById(args.id)
            user.email = args.email
            const currentUser = context.currentUser

            if (!currentUser) {
                throw new AuthenticationError('Musisz być zalogowany aby dokonać tej operacji')
            }

            try {
                await user.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }

            return user
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
            try {
                const decodedToken = jwt.verify(token, process.env.SECRET)
                const currentUser = await User.findById(decodedToken.id)
                return { currentUser} 
        //if token is expired, it throws an error
            } catch (error) {
                throw new AuthenticationError(
                    'Proszę się zalogowac'
                )
            }
        }

    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
