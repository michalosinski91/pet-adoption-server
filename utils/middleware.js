const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'unknown endpoint'})
}

const errorHandler = (err, req, res, next) => {
    if (err.name = 'Cast Error' && err.kind == 'ObjectId') {
        return res.status(400).send({ error: 'malformatted id'})
    } else if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message })
    } 
    console.log(err.message)
    next(err)
}

module.exports = {
    unknownEndpoint,
    errorHandler
}