
import adminModel from "../../../models/admin";
import outfit from "../../../models/outfit";
import userModel from "../../../models/user";



const adminServices = {

    checkAdmin: async (email) => {
        return await adminModel.findOne({ email: email });
    },

    findAdmin: async (_id) => {
        return await adminModel.findOne({ _id: _id });
    },

    updateAdmin: async (query, obj) => {
        return await adminModel.findByIdAndUpdate(query, obj, { new: true });
    },

    paginateUsers: async (body, userType) => {
        let { search, page, limit, fromDate, toDate } = body;
        let query = { userType: userType }
        page = parseInt(page) + 1 || 1;
        if (search) {
            query.$or = [
                {
                    name: { $regex: search, $options: 'i' }
                },
                {
                    userName: { $regex: search, $options: 'i' }
                },
                {
                    email: { $regex: search, $options: 'i' }
                }
            ]
        };
        if (fromDate && !toDate) {
            query.createdAt = { $gte: fromDate };
        };
        if (!fromDate && toDate) {
            query.createdAt = { $lte: toDate };
        };
        if (fromDate && toDate) {
            query.$and = [
                { createdAt: { $gte: fromDate } },
                { createdAt: { $lte: toDate } },
            ]
        };
        const options = {
            page: page,
            limit: parseInt(limit) || 10,
            select: '-password -otp -otpTime',
            sort: { createdAt: -1 }
        };
        return await userModel.paginate(query, options);
    },

    paginateProducts: async (body) => {
        let { search, page, limit, fromDate, toDate } = body;
        let query = {};
        page = parseInt(page) + 1 || 1;
        if (search) {
            query.$or = [
                {
                    name: { $regex: search, $options: 'i' }
                }
            ]
        };
        if (fromDate && !toDate) {
            query.createdAt = { $gte: fromDate };
        };
        if (!fromDate && toDate) {
            query.createdAt = { $lte: toDate };
        };
        if (fromDate && toDate) {
            query.$and = [
                { createdAt: { $gte: fromDate } },
                { createdAt: { $lte: toDate } },
            ]
        };
        const options = {
            page: page,
            limit: parseInt(limit) || 10,
            populate: [
                {
                    path: 'userId',
                    select: '-password -otp -otpTime'
                },
                {
                    path: 'category',
                    select: 'name'
                }
            ],
            sort: { createdAt: -1 }
        };
        return await outfit.paginate(query, options);
    },

    countUsers: async (query) => {
        return await userModel.countDocuments(query)
    },

    listUsers: async (query) => {
        return await userModel.find(query)
    },

    countOutfits: async (query) => {
        return await outfit.countDocuments(query)
    },

    deleteOutfit: async (query) => {
        return await outfit.findByIdAndDelete(query)
    },

}

export { adminServices };

