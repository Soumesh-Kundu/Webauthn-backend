import JWT from 'jsonwebtoken'
import {config} from 'dotenv'
config()

//middleware for authenticate the JWT token and decryption
const JWT_SECRET=process.env.SINGING_SECRET
export function authenticator(req,res,next){
    const token=req.headers["sessiontoken"]
    if(!token){
        return res.status(401).json({error:"Please authenticate using valid token"})
    }
    try {
        const data=JWT.verify(token,JWT_SECRET)
        req.user=data.user
        next()
    } catch (error) {
        return  res.status(401).json({error:"Please authenticate using valid token"})
    }
}