import Mongoose, { Schema, Types } from "mongoose";
//import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var userModel = new Schema(
  {
    email: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    userName: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      enum: ["user", "brand"],
      default: "user",
    },
    yearFounded: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary"],
    },
    profilePic: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otpTime: {
      type: Number,
      default: 0,
    },
    deviceToken: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      default: null,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    socialId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  { timestamps: true }
);

userModel.plugin(mongoosePaginate);
userModel.index({ location: "2dsphere" });
Mongoose.model("user", userModel).ensureIndexes();
export default Mongoose.model("user", userModel);
