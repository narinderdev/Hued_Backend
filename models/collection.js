import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var Model = new Schema(
    {
        name: {
            type: String
        },
        userId: {
            type: Types.ObjectId,
            ref: 'user',
            default: null
        }
    },
    { timestamps: true }
);

Model.plugin(mongoosePaginate);
export default Mongoose.model("collections", Model);
