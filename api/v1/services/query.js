
import QueryModel from "../../../models/query";

const queryServices = {

    createQuery: async (obj) => {
        return await QueryModel.create(obj);
    },

    checkQuery: async (email) => {
        return await QueryModel.findOne({ email: email });
    },

    findQuery: async (_id) => {
        return await QueryModel.findOne({ _id: _id });
    },

    updateQuery: async (query, obj) => {
        return await QueryModel.findByIdAndUpdate(query, obj, { new: true });
    },

    paginateQueries: async (body) => {
        let { search, page, limit, fromDate, toDate, status } = body;
        let query = {};
        page = parseInt(page) + 1 || 1;
        if (search) {
            query.$or = [
                {
                    name: { $regex: search, $options: 'i' },
                    email: { $regex: search, $options: 'i' },
                    id: { $regex: search, $options: 'i' }
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
        if (status) {
            query.status = status;
        };
        const options = {
            page: page,
            limit: parseInt(limit) || 10,
            sort: { createdAt: -1 }
        };
        return await QueryModel.paginate(query, options);
    },

}

export { queryServices };

