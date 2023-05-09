import mongoose from "mongoose";

//setting the OTP Schema
const TokenSchema=mongoose.Schema({
    secret:{type:String,require:true},
    user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    created_At:{type:Date,default:Date.now}
})

export default mongoose.model('Token',TokenSchema)