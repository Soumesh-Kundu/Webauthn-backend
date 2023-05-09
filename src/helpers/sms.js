//all imports
import twilio from "twilio"
import {config} from 'dotenv'
config()
 
//setting twilio client 
const client=twilio(process.env.AC_ID,process.env.AUTH_KEY)

//sending message with twilio
export default async function sendSMS({to,body})
{
    try {
        const res=await client.messages.create({
            body,
            to,
            from:process.env.TWILIO_NUM
        })
        return res
    } catch (error) {
        console.log(error)
    }
}
