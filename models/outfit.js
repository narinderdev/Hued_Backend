import Mongoose, { Schema, Types } from "mongoose";
//import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import aggregatePaginate from "mongoose-aggregate-paginate";
var model = new Schema(
  {
    name: {
      type: String,
      default: null,
    },
    colors: [
      {
        type: String,
      },
    ],
    category: {
      type: Types.ObjectId,
      ref: "categories",
      default: null,
    },
    gender: { type: String, enum: ["Male", "Female", "Non-binary"] },
    userId: {
      type: Types.ObjectId,
      ref: "user",
      default: null,
    },
    image: { type: Array, default: [] },
    ageStart: {
      type: Number,
      default: 0,
    },
    ageEnd: {
      type: Number,
      default: 0,
    },
    priceStart: {
      type: Number,
      default: 0,
    },
    priceEnd: {
      type: Number,
      default: 0,
    },
    style: {
      type: Array,
      default: [],
    },
    weather: {
      type: Array,
      default: [],
    },
    occasion: {
      type: Array,
      default: [],
    },
    isDeleted: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: true },
    wardroabeList: [{ type: Mongoose.SchemaTypes.ObjectId, ref: "user" }],
    likedBy: [{ type: Mongoose.SchemaTypes.ObjectId, ref: "user" }],
    views: [
      { type: String, default: [] }
    ],
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

model.plugin(mongoosePaginate);
model.plugin(aggregatePaginate);
model.index({ location: "2dsphere" });
Mongoose.model("outfits", model).ensureIndexes();
export default Mongoose.model("outfits", model);
