//all imports
import express from 'express'
import {
    generateAuthenticationOptions, verifyAuthenticationResponse
} from '@simplewebauthn/server';
import User from '../models/User.js';
import Token from '../models/Token.js';
import JWT from 'jsonwebtoken'
import {config} from 'dotenv'
import { OTPGenerator, base64urlToUint8, uint8Tobase64url } from '../helpers/helper.js';
import { VerifyOTP } from '../helpers/helper.js';
import sendSMS from '../helpers/sms.js';

export const route=express.Router()

//setting the values from env
config()
const JWT_SECRET=process.env.SINGING_SECRET
const rpName=process.env.RP_NAME
const rpID=process.env.RP_ID
const origin=`https://${rpID}`

// route-I: /authenticate - to authenticate user by sending OTP to the user's number
route.post('/',async(req,res)=>{
    const {Email}=req.body
    try {
        const userData=await User.findOne({Email})
        if(!userData){
            return res.status(400).json({error:"User doesn't exists"})
        }
        const {Phone,id:user}=userData
        const {secret,token}=OTPGenerator()
        await Token.findOneAndUpdate({user},{
            secret,
            user,
            created_At:Date.now()
        },{upsert:true})

        await sendSMS({
            to: Phone,
            body: `Your OTP is ${token}, this is valid for 60 seconds only`
        })

        res.status(200).json({success:true,message:"Otp Sented"})
    } catch (error) {
        console.log(error)
    }
})

// route-II: /authenticate/token-authenticate - to verify the otp of the user from client
route.post('/token-authenticate',async (req,res)=>{
    const {Email,token}=req.body
    try {
        const user=await User.findOne({Email})
        const {id,secret,user:userId,created_At}=await Token.findOne({user:user.id})
        if(userId.toString()!==user.id){
            return res.status(401).json({error:"Please enter a valid token"})
        }
        if(Date.now()-created_At>65000){
            return res.status(408).json({error:'OTP expired'})
        }
        const verified=VerifyOTP(secret,token)
        if(!verified){
            return res.status(400).json({error:'Please enter a valid token'})
        }
        await Token.findByIdAndDelete(id)
        res.status(200).json({message:"user Verified"})
    } catch (error) {
        
    }
})

//route-III: /authenticate/generate-authenticate-option - to generate authentication option of WebAuthn 
route.post('/generate-authenticate-option',async (req, res) => {
    const {Email,deviceID,mac}=req.body
    try {
        const user = await User.findOne({Email})
        const authenticators = user.devices
        const device =mac?null:authenticators.find(device => device.id === deviceID)
        if (!device && !mac) {
            return res.status(401).json({ error: 'device not recognized for this user' })
        }
        const allowCredentials = []
        authenticators.forEach(authenticator => {
            allowCredentials.push({
                id: base64urlToUint8(authenticator.credentialID),
                type: "public-key",
                transports: authenticator.transports
            })
        })
        const options = generateAuthenticationOptions({
            allowCredentials,
            rpID,
            userVerification: "preferred"
        })
        res.status(200).json(options)
        await User.findByIdAndUpdate(user.id,{$set:{challenge:options.challenge}})
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

//route-IV: /authenticate/Verify-Authentication - to verify the WebAuthn authentication object coming from client

route.post('/Verify-Authentication', async (req, res) => {
    const { authenticationBody: body,Email } = req.body 
    try {
        const user = await User.findOne({Email})
        const {challenge:expectedChallenge} = user
        const authenticator = user.devices.find(device => device.credentialID === body.id)
        if (!authenticator) {
            return res.status(401).json({ status: "failed", message: "No authenticator found" })
        }
        let verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator:{
                ...authenticator,
                credentialID:base64urlToUint8(authenticator.credentialID),
                credentialPublicKey:base64urlToUint8(authenticator.PublicKey)
            }
        })
        const { verified, authenticationInfo } = verification
        if(!verified){
            return res.status(401).json({verified,error:"Unauthorize access"})
        }
        const data={
            user:{
                id:user.id
            }
        }
        const sessionToken=JWT.sign(data,JWT_SECRET)
        const { newCounter } = authenticationInfo
        res.status(200).json({ verified,sessionToken })
        await User.findByIdAndUpdate(user.id,{$set:{challenge:""}})
        await User.findOneAndUpdate({_id:user.id,"devices._id":authenticator.id},{$set:{"devices.$.counter":newCounter}})
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server Error" })
    }
})
