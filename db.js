//all imports
import mongoose from "mongoose";
import { config } from 'dotenv'
config()


const mongo_URL = process.env.DB_URL

export default function dbConnect() {
    mongoose.connect(mongo_URL)
    mongoose.connection.on('connected', () => {
        console.log("Database is active")
    })
    mongoose.connection.on('error', (e) => {
        console.log("Database error")
        console.log(e)
    })
}