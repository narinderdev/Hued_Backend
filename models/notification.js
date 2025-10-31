import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var Model = new Schema(
    {
        toId: {
            type: Types.ObjectId,
            ref: 'user',
            default: null
        },
        message: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

Model.plugin(mongoosePaginate);
export default Mongoose.model("notifications", Model);
