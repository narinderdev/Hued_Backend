import Mongoose, { Schema, Types } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate";
const model = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'user'
        },
        outfitId: {
            type: Types.ObjectId,
            ref: 'outfits'
        },
        collectionId: {
            type: Types.ObjectId,
            ref: 'collections'
        }
    },
    { timestamps: true }
);

model.plugin(aggregatePaginate);
export default Mongoose.model("wardrobe", model);
