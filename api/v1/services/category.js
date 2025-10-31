
import category from "../../../models/category";
import wConfig from "../../../models/wardrobeConfig";

const categoryServices = {

    findCategory: async (query) => {
        return await category.findOne(query);
    },

    createCategory: async (obj) => {
        return await category.create(obj);
    },

    updateCategory: async (query, obj) => {
        return await category.findByIdAndUpdate(query, obj, { new: true });
    },
    deleteCategory: async (query) => {
        return await category.findByIdAndDelete(query);
    },

    listCategories: async () => {
        return await category.find({}).sort({ createdAt: -1 });
    },

    paginateCategorySearch: async (validatedBody) => {
        let query = {};
        let { search, fromDate, toDate, page, limit } = validatedBody;
        page = parseInt(page) + 1 || 1
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }
            ]
        }
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
        let options = {
            page: page,
            limit: parseInt(limit) || 10,
            sort: { createdAt: -1 }
        };
        return await category.paginate(query, options);
    },

    findConfig: async (query) => {
        return await wConfig.findOne(query);
    },

}

export { categoryServices };

