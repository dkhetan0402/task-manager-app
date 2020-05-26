const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = mongoose.Schema({
    name:{
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email address is not valid');
            }
        }
    },
    age: {
        type: Number,
        validate(value){
            if(value < 0){
                throw new Error('Age cannot be negative');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(value.length < 6){
                throw new Error('Password cannot be less than 6 characters long!');
            }else if(validator.contains(value,'password')){
                throw new Error('Password cannot contain password');
            }
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar:{
        type: Buffer
    }
},{
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// Method to generate token for login. This is equivalent to instance method in java
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = await jwt.sign({_id: user._id}, process.env.JWT_SECRET,{expiresIn: "1 day"});
    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
}

userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
}

// Find user by credentials. This method is equivalent to a static method in java
userSchema.statics.findUserByCredentials = async (email, password) => {
    try{
        const user = await User.findOne({email});
        if(!user){
            throw new Error('Unable to login!');
        }

        const isMatched = await bcryptjs.compare(password, user.password);

        if(!isMatched){
            throw new Error('Unable to login!');
        }
        
        return user;
    }catch(e){
        throw new Error('Unable to login!');
    }   
}
// Hash the password
userSchema.pre('save', async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcryptjs.hash(user.password,8);
    }
    next();
});

userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.Task.deleteMany({owner: user._id})
    next();
})

const User = mongoose.model('User', userSchema);



const allowedUpdates = ['name', 'age', 'email', 'password'];

module.exports = {
    User,
    allowedUpdates
};