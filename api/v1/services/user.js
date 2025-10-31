
import userModel from "../../../models/user";



const userServices = {
  userCheck: async (email, userType) => {
    let query = { isDelete: false, $or: [{ email: email }, { userName: email }] };
    if (userType) {
      query.userType = userType;
    }
    return await userModel.findOne(query);
  },

  findUser: async (query) => {
    return await userModel.findOne(query);
  },

  createUser: async (obj) => {
    return await userModel.create(obj);
  },

  updateUser: async (query, obj) => {
    return await userModel.findByIdAndUpdate(query, obj, { new: true });
  },

  deleteUser: async (query) => {
    return await userModel.findByIdAndDelete(query);
  },

}

export { userServices };

