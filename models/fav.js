import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var Model = new Schema(
    {
        outfitId: {
            type: Types.ObjectId,
            ref: 'outfits',
            default: null
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
export default Mongoose.model("favourites", Model);
