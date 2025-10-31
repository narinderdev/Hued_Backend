import { Types } from "mongoose";
import outfitModel from "../../../models/outfit";
import favModel from "../../../models/fav";
import wardrobe from "../../../models/wardrobe";

const outfitServices = {
  createOutfit: async (obj) => {
    return await outfitModel.create(obj);
  },

  outfitList: async (query) => {
    let data = await outfitModel
      .find(query)
      .populate([
        {
          path: "userId",
          select: "-otp -otpTime -password",
        },
        {
          path: "category",
          select: "name",
        },
      ])
      .sort({ createdAt: -1 });

    for (let d of data) {
      d.viewCounts = d.views.length;
    };
    return data
  },

  checkOutfit: async (email) => {
    return await outfitModel.findOne({ email: email });
  },

  findOutfit: async (_id) => {
    return await outfitModel.findOne({ _id: _id });
  },

  checkOutfit: async (query) => {
    return await outfitModel.findOne(query);
  },

  updateOutfit: async (query, obj) => {
    return await outfitModel.findByIdAndUpdate(query, obj, { new: true });
  },

  exploreAggregate: async (query, userId) => {
    let {
      page,
      limit,
      search,
      style,
      weather,
      occasion,
      category,
      priceStart,
      priceEnd,
      ageStart,
      ageEnd,
      gender,
      long,
      lat
    } = query;
    page = parseInt(page) + 1 || 1;
    let data = [];
    if (long && lat) {
      data.push(

        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [long, lat] // User's coordinates
            },
            distanceField: "distance",
            spherical: true,
            maxDistance: 20 * 1000 // Maximum distance from user's location
          }
        }
      )
    };
    data.push(
      {
        $match: {
          isPrivate: false
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
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          viewCounts:
            { $ifNull: [{ $size: "$views" }, 0] }
        }
      }
    );
    if (search && search !== '') {
      data.push({
        $match: {
          $or: [
            {
              name: { $regex: search, $options: "i" },
            },
            {
              name: { $regex: search, $options: "i" },
            },
            {
              "category.name": { $regex: search, $options: "i" },
            },
          ],
        },
      });
    }
    if (category && category != "1") {
      data.push({
        $match: {
          "category._id": new Types.ObjectId(category),
        },
      });
    }
    if (style && style.length !== 0) {
      data.push({
        $match: {
          style: { $in: style },
        },
      });
    }
    if (weather && weather.length !== 0) {
      data.push({
        $match: {
          weather: { $in: weather },
        },
      });
    };
    if (occasion && occasion.length !== 0) {
      data.push({
        $match: {
          occasion: { $in: occasion },
        },
      });
    };
    if (priceStart && priceEnd && priceEnd !== '' && priceStart !== '') {
      data.push({
        $match: {
          $and: [
            {
              $expr: { $gt: ["$priceStart", parseInt(priceStart)] },
            },
            {
              $expr: { $lt: ["$priceEnd", parseInt(priceEnd)] },
            },
          ],
        },
      });
    };
    if (ageStart && ageEnd && ageStart !== '' && ageEnd !== '') {
      data.push({
        $match: {
          $and: [
            {
              $expr: { $gte: ["$ageStart", parseInt(ageStart)] },
            },
            {
              $expr: { $lte: ["$ageEnd", parseInt(ageEnd)] },
            },
          ],
        },
      });
    };
    if (gender && gender !== '') {
      data.push({
        $match: {
          gender: { $regex: gender, $options: 'i' },
        },
      });
    }
    let aggregate = outfitModel.aggregate(data);
    let options = {
      page: page,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 },
    };
    let results = await outfitModel.aggregatePaginate(aggregate, options);
    for (let o of results.docs) {
      let fav = await wardrobe.findOne({ outfitId: o._id, userId: userId });
      if (fav) {
        o.favourite = true;
      } else {
        o.favourite = false;
      }
    }
    return results;
  },
  outfitCounts: async (query) => {
    return await outfitModel.countDocuments(query);
  },
  paginateOutfit: async (body) => {
    let { category, page, limit, userId } = body;
    let query = {};
    if (category && category !== "") {
      query.category = category;
    }
    if (userId && userId !== "") {
      query.userId = userId;
    }
    page = parseInt(page) + 1 || 1;
    let options = {
      page: page,
      limit: parseInt(limit) || 10,
      populate: [
        {
          path: "category",
          select: "name",
        },
        {
          path: "userId",
          select: "-password -otp -otpTime",
        },
      ],
    };
    return await outfitModel.paginate(query, options);
  },
  findOutFit: async (outFitId, userId) => {
    // const token = await
    const check = await outfitModel.findOne({
      _id: outFitId,
      isDeleted: false,
    });

    return check;
  },
  likeOutFit: async (outfit, userId) => {
    if (outfit.likedBy) {
      if (JSON.stringify(outfit.likedBy).includes(userId)) {
        await outfitModel.findByIdAndUpdate(
          { _id: outfit._id, isDeleted: false },
          { $pull: { likedBy: userId } }
        );
        return false;
      } else {
        await outfitModel.findByIdAndUpdate(
          { _id: outfit._id, isDeleted: false },
          { $push: { likedBy: userId } }
        );
        return true;
      }
    } else {
      return false;
    }
  },

  deleteOutfit: async (query) => {
    return await outfitModel.findByIdAndDelete(query);
  }
};

export { outfitServices };
