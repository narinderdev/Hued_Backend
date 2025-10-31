
import collections from "../../../models/collection";



const collectionServices = {


    findCollection: async (query) => {
        return await collections.findOne(query);
    },

    createCollection: async (obj) => {
        return await collections.create(obj);
    },

    updateCollection: async (query, obj) => {
        return await collections.findByIdAndUpdate(query, obj, { new: true });
    },

    remCollection: async (query, obj) => {
        return await collections.findByIdAndDelete(query);
    },

    collectionList: async (query, obj) => {
        return await collections.find(query).populate([{path:"outfitId",populate:[{path:'category'}]}]).sort({ createdAt: -1 });
    },

    paginateCollectionList: async (query) => {
        let { page, limit, userId, search } = query;
        page = parseInt(page) + 1 || 1;
        let queryData = { userId: userId }
        if (search) {
            queryData.name = { $regex: search, $options: "i" };
        };
        const options = {
            page: page,
            limit: parseInt(limit) || 10,
            populate: [
                {
                    path: 'outfitId',
                    select: '-userId',
                    populate: [
                        {
                            path: 'category'
                        }
                    ]
                },
                {
                    path: 'userId',
                    select: 'name profilePic'
                }
            ],
            sort: {
                createdAt: -1
            }
        }
        return await collections.paginate(queryData, options)
    }

}

export { collectionServices };

