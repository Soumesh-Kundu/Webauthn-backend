import mongoose from 'mongoose'

//setting the user Schema
const UserSchema=mongoose.Schema({
    Email:{type:String,require:true,unique:true},
    Phone:{type:Number,require:true},
    devices:{
        type:[{
            credentialID:{type:String},
            counter:{type:Number},
            PublicKey:{type:String}
        }],default:[]
    },
    challenge:{type:String}
})
export default mongoose.model("User",UserSchema)