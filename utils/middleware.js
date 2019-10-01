const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'Nieznana Ścieżka'})
}

const errorHandler = (err, req, res, next) => {
    if (err.name = 'Cast Error' && err.kind == 'ObjectId') {
        return res.status(400).send({ error: 'Niepoprawne ID'})
    } else if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Wprowadzone dane nie spełniają wymogów' })
    } 
    console.log(err.message)
    next(err)
}

module.exports = {
    unknownEndpoint,
    errorHandler
}