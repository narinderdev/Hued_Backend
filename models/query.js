import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var QueryModel = new Schema(
    {
        id: {
            type: String,
            default: null
        },
        email: {
            type: String,
            default: null
        },
        name: {
            type: String,
            default: null
        },
        subject: {
            type: String,
            default: null
        },
        comment: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'closed'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

QueryModel.plugin(mongoosePaginate);
export default Mongoose.model("contactUs", QueryModel);
