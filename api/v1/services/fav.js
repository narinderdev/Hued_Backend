
import favModel from "../../../models/fav";

const favServices = {

    addFav: async (obj) => {
        return await favModel.create(obj);
    },

    findFav: async (query) => {
        return await favModel.findOne(query);
    },

    removeFav: async (query) => {
        return await favModel.findByIdAndDelete(query);
    },

    paginateFav: async (query) => {
        let { userId, page, limit } = query;
        page = parseInt(page) + 1 || 1;
        const options = {
            page: page ,
            limit: parseInt(limit) || 10,
            populate: [
                {
                    path: 'outfitId',
                    select:'-userId -category'
                },
                {
                    path: 'userId',
                    select: 'name profilePic'
                }
            ]
        }
        return await favModel.paginate({ userId: userId }, options)
    }

}

export { favServices };

