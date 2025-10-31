
import { Types } from "mongoose";
import wardrobeModel from "../../../models/wardrobe";
import favModel from '../../../models/fav';



const wardrobeServices = {


    findWardrobe: async (query) => {
        return await wardrobeModel.findOne(query);
    },

    createWardrobe: async (obj) => {
        return await wardrobeModel.create(obj);
    },

    updateWardrobe: async (query, obj) => {
        return await wardrobeModel.findByIdAndUpdate(query, obj, { new: true });
    },

    delWardobe: async (query) => {
        return await wardrobeModel.findByIdAndDelete(query);
    },

    delAllWardobe: async (query) => {
        return await wardrobeModel.deleteMany(query);
    },

    wardrobeAggregate: async (query, userId) => {
        let {
            page,
            limit,
            search,
            collectionId
        } = query;
        page = parseInt(page) + 1 || 1;
        let data = [];
        data.push(
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    collectionId: new Types.ObjectId(collectionId)
                }
            },
            {
                $lookup: {
                    from: "outfits",
                    let: {
                        outfitId: "$outfitId",
                    },
                    as: "outfitId",
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$$outfitId", "$_id"] },
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                let: {
                                    category: "$category",
                                },
                                as: "category",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ["$$category", "$_id"] },
                                        },
                                    },
                                    {
                                        $project: {
                                            name: 1,
                                        },
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: {
                                path: "$category",
                                preserveNullAndEmptyArrays: true,
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: {
                                    userId: "$userId",
                                },
                                as: "userId",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ["$$userId", "$_id"] },
                                            isDelete: false
                                        },
                                    },
                                    {
                                        $project: {
                                            password: 0,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $unwind: {
                                path: "$userId",
                                preserveNullAndEmptyArrays: true,
                            },
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$outfitId",
                    preserveNullAndEmptyArrays: true,
                }
            }
        );
        if (search && search !== '') {
            data.push({
                $match: {
                    $or: [
                        {
                            "outfitId.userId.name": { $regex: search, $options: "i" },
                        },
                        {
                            "outfitId.name": { $regex: search, $options: "i" },
                        },
                        {
                            "outfitId.category.name": { $regex: search, $options: "i" },
                        },
                    ],
                },
            });
        }
        let aggregate = wardrobeModel.aggregate(data);
        let options = {
            page: page,
            limit: parseInt(limit) || 10,
            sort: { createdAt: -1 },
        };
        let results = await wardrobeModel.aggregatePaginate(aggregate, options);
        let array = [];
        for (let o of results.docs) {
            array.push(o.outfitId)
        }
        results.docs = array;
        return results;
    }

}

export { wardrobeServices };

