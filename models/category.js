import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var model = new Schema(
    {

        name: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

model.plugin(mongoosePaginate);
export default Mongoose.model("categories", model);

(async () => {
    try {
        let data = await Mongoose.model("categories", model).find();
        if (data.length == 0) {
            let arr = [
                {
                    name: 'jackets'
                },
                {
                    name: 'jeans'
                },
                {
                    name: 'sweatshirts'
                },
                {
                    name: 'pants'
                },
                {
                    name: 't-shirts'
                },
                {
                    name: 'tracksuits'
                }
            ];
            await Mongoose.model("categories", model).insertMany(arr);
        };
        console.log("Category already exists!!");
    } catch (error) {
        console.dir(error, { depth: null });
    }
})()
