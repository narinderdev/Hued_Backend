import bcrypt from "bcryptjs";
import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
var adminModel = new Schema(
    {
        email: {
            type: String,
            default: "admin@mailinator.com"
        },
        name: {
            type: String,
            default: "admin"
        },
        profilePic: {
            type: String,
            default: null
        },
        password: {
            type: String,
            default: bcrypt.hashSync("Test@123")
        },
        otp: {
            type: String,
            default: null
        },
        otpTime: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

adminModel.plugin(mongoosePaginate);
export default Mongoose.model("admin", adminModel);

(async () => {
    try {
        let admin = await Mongoose.model("admin", adminModel).findOne({});
        if (!admin) {
            await Mongoose.model("admin", adminModel).create({})
        }
        else{
            console.log("Admin already exits!!");
        }
    } catch (error) {
        console.dir(error, { depth: null })
    }
})();
