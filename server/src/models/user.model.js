import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
const userSchema = new Schema({
    username:{
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email:{
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname:{
        type : String,
        required : true,
        trim : true,
    },
    avatar:{
        type : String, //for cloudnary url
        required : true,
    },
    coverImage:{
        type : String,
        // required : true,
    },
    watchHistory:[
        {
            type : Schema.Types.ObjectId,
            ref : "Vedio"
        }
    ],
    password:{
        type : String ,
        required : true
    },
    refreshToken:{
        type : String,
        default : ""
    }
},
{
    timestamps : true
})

// encryption and decryption of password
userSchema.pre("save",async function (next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
    }
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    const token = jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )

    return token
}

userSchema.methods.generateRefreshToken = function(){
    const token = jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )

    return token
}
export const User = mongoose.model("User",userSchema);