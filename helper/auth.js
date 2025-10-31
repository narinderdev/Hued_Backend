import config from "config";
import jwt from "jsonwebtoken";
import userModel from "../models/user";
import adminModel from "../models/admin";
import apiError from "./apiError";
import responseMessage from "../../assets/responseMessage";

export default {
  verifyToken(req, res, next) {
    if (req.headers.token) {
      jwt.verify(
        req.headers.token,
        config.get("jwtsecret"),
        async (err, result) => {
          console.log(result);
          if (err) {
            if (err.name == "TokenExpiredError") {
              return res.status(401).send({
                responseCode: 401,
                responseMessage: "Session Expired, Please login again.",
              });
            } else {
              return res.status(401).send({
                responseCode: 401,
                responseMessage: responseMessage.UNAUTHORIZED,
              });
            }
          } else {
            let user = await userModel.findOne({ _id: result._id });
            if (!user) {
              return res.status(401).json({
                responseCode: 401,
                responseMessage: responseMessage.USER_NOT_FOUND,
              });
            }
            if (user.isBlock == true) {
              return res.status(401).json({
                responseCode: 401,
                responseMessage: responseMessage.BLOCK_BY_ADMIN,
              });
            } else {
              req.userId = result._id;
              req.userDetails = result;
              next();
            }
          }
        }
      );
    } else {
      throw apiError.invalid(responseMessage.NO_TOKEN);
    }
  },

  adminToken(req, res, next) {
    if (req.headers.token) {
      jwt.verify(
        req.headers.token,
        config.get("jwtsecret"),
        async (err, result) => {
          if (err) {
            if (err.name == "TokenExpiredError") {
              return res.status(401).send({
                responseCode: 401,
                responseMessage: "Session Expired, Please login again.",
              });
            } else {
              throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
            }
          } else {
            let user = await adminModel.findOne({ _id: result._id });
            if (!user) {
              return res.status(401).json({
                responseCode: 401,
                responseMessage: responseMessage.USER_NOT_FOUND,
              });
            } else {
              req.userId = result._id;
              req.userDetails = result;
              next();
            }
          }
        }
      );
    } else {
      throw apiError.invalid(responseMessage.NO_TOKEN);
    }
  },
};
