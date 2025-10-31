import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var model = new Schema(
    {
        style: {
            type: Array,
            default: [
                'Sport wear',
                'Casual',
                'Gothic Fashion',
                'Vintage',
                'Boho-chic',
            ]
        },
        weather: {
            type: Array,
            default: [
                'Spring',
                'Autumn',
                'Summer',
                'Winter',
            ]
        },
        occasion: {
            type: Array,
            default: [
                'Party',
                'Ethnic Wear',
                'Night Wear',
                'Lourge Wear'
            ]
        }
    },
    { timestamps: true }
);

model.plugin(mongoosePaginate);
export default Mongoose.model("wardrobe_config", model);

(async () => {
    try {
        let data = await Mongoose.model("wardrobe_config", model).findOne({});
        if (!data) {
            await Mongoose.model("wardrobe_config", model).create({})
        }
        else {
            console.log("Config already exits!!");
        }
    } catch (error) {
        console.dir(error, { depth: null })
    }
})();
