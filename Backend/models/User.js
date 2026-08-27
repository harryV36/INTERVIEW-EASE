// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//         name:{
//             type:String,
//             required:true,
//             trim:true,
//         },
//         email:{
//             type:String,
//             required:true,
//             unique:true,
//             trim:true,
//             match:[/.+\@.+\..+/,'Please enter a valid email']
//         },
//         password:{
//             type:String,
//             required:true,
//             minLength:6,
//         },
// });

// export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  role: {
    type: String,
    enum: ["student", "organization", "admin"],
    default: "student",
  },
  credits: {
    type: Number,
    default: 20,
    min: 0,
  },
  signupDeviceId: {
    type: String,
    trim: true,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Organization reference (if user is part of one)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

userSchema.index(
  { signupDeviceId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { signupDeviceId: { $type: "string" } } }
);

export default mongoose.model("User", userSchema);
