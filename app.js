//all imports
import express from 'express'
import cors from 'cors'
import dbConnect from './db.js'
import {route as authRoute} from './src/routes/authenticate.js'
import {route as regRoute} from './src/routes/register.js'

const app = express()


// data base connection and middlewares 
dbConnect()
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.status(200).json({ message: "hello world" })
})

//router setup
app.use('/register',regRoute)
app.use('/authenticate',authRoute)

app.listen(3000, () => {
    console.log("server is running on http://localhost:3000")
})