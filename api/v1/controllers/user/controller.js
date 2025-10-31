import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import { response, ErrorResponce } from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import config from "config";
import { userServices } from "../../services/user";
import { categoryServices } from "../../services/category";
import { queryServices } from "../../services/query";
import { outfitServices } from "../../services/outfit";
import { favServices } from "../../services/fav";
import { collectionServices } from "../../services/collection";
import { notificationService } from "../../services/notification";

import {
  STATUS_CODES as st,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "./../../../../../config/appConstants.js";
const { userCheck, createUser, updateUser, findUser, deleteUser } = userServices;
const { findCategory, listCategories, createCategory, findConfig } =
  categoryServices;

const { createQuery } = queryServices;

const {
  createOutfit,
  outfitList,
  exploreAggregate,
  outfitCounts,
  paginateOutfit,
  findOutFit,
  likeOutFit,
  checkOutfit,
  updateOutfit,
  deleteOutfit
} = outfitServices;
const { addFav, findFav, removeFav, paginateFav } = favServices;
import path from "path";
const dir = path.resolve();
import Handlebars from "handlebars";
import fs from "fs";
var resetPassword = fs.readFileSync(
  path.join(dir, "views/email/resetPassword.hbs"),
  "utf8"
);
var resetPasswordTemplate = Handlebars.compile(resetPassword);

import { wardrobeServices } from '../../services/wardrobe.js';
const {
  createWardrobe,
  findWardrobe,
  delWardobe,
  wardrobeAggregate,
  delAllWardobe
} = wardrobeServices;

const {
  createCollection,
  findCollection,
  collectionList,
  remCollection,
  paginateCollectionList
} = collectionServices;

import wardrobeModel from "../../../../models/wardrobe.js";
const {
  paginateNotification
} = notificationService;
export class userController {
  /**
   * @swagger
   * /user/signup:
   *   post:
   *     tags:
   *       - USER
   *     description: signup
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: signup
   *         description: signup
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/signup'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async signup(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
      name: Joi.string().allow("").optional(),
      userName: Joi.string().allow("").optional(),
      profilePic: Joi.string().allow("").optional(),
      gender: Joi.string().allow("male", "female", "non-binary").optional(),
      deviceType: Joi.string().allow("").optional(),
      deviceToken: Joi.string().allow("").optional(),
      userType: Joi.string().allow("").required(),
      city: Joi.string().allow("").optional(),
      yearFounded: Joi.string().allow("").optional(),
      profileComplete: Joi.boolean().optional(),
      lat: Joi.number().allow().optional(),
      long: Joi.number().allow().optional()
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.trim();
        req.body.email = req.body.email.toLowerCase();
      };
      let validBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        password,
        name,
        userName,
        deviceType,
        deviceToken,
        gender,
        userType,
        city,
        yearFounded,
        profileComplete,
        lat,
        long
      } = validBody;
      let user = await userCheck(email, userType);
      if (user) {
        if (user.isBlock == true) {
          throw apiError.unauthorized(responseMessage.BLOCK_USER_BY_ADMIN);
        } else {
          throw apiError.conflict(responseMessage.USER_ALREADY_EXIST);
        }
      }
      if (userName) {
        let check = await userCheck(userName);
        if (check) {
          throw apiError.conflict(responseMessage.USERNAME_EXISTS);
        }
      }
      let obj = {
        email: email,
        name: name,
        userName: userName,
        gender: gender,
        password: bcrypt.hashSync(password),
        city: city,
        yearFounded: yearFounded,
        profileComplete: profileComplete,
        location: {
          type: 'Point',
          coordinates: [long || 0, lat || 0]
        }
      };
      if (deviceType && deviceToken) {
        obj.deviceType = deviceType;
        obj.deviceToken = deviceToken;
      }
      if (userType) {
        obj.userType = userType;
      }
      user = await createUser(obj);
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      let token = await commonFunction.getToken({
        _id: user._id,
        email: user.email,
      });
      user._doc.accessToken = token;
      return res.json(new response(user, responseMessage.USER_CREATED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags:
   *       - USER
   *     description: login
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: login
   *         description: login
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/login'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async login(req, res, next) {
    const validationSchema = {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      deviceType: Joi.string().allow("").optional(),
      deviceToken: Joi.string().allow("").optional(),
      userType: Joi.string().allow("").optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      let validBody = await Joi.validate(req.body, validationSchema);
      const { email, password, deviceType, deviceToken, userType } = validBody;
      let user = await userCheck(email, userType);
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (user.isBlock == true) {
        throw apiError.unauthorized(responseMessage.BLOCK_USER_BY_ADMIN);
      }
      // if (user.verify == false) {
      //     const otpTime = Date.now() + 180000;
      //     const otp = await commonFunction.getOTP();
      //     const link = `${config.get('baseURL')}/user/verify/${email}/${otp}`;
      //     await commonFunction.sendEmail(email, 'Email Verification', link);
      //     await updateUser({ _id: user._id }, {
      //         $set: {
      //             otp: otp,
      //             otpTime: otpTime
      //         }
      //     });
      //     return res.json(new response({ send: true }, responseMessage.LINK_SEND));
      // };
      if (!bcrypt.compareSync(password, user.password)) {
        throw apiError.unauthorized(responseMessage.INCORRECT_LOGIN);
      }
      if (deviceType && deviceToken) {
        await updateUser(
          { _id: user._id },
          { $set: { deviceType: deviceType, deviceToken: deviceToken } }
        );
      }
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      delete user._doc.otp;
      delete user._doc.otpTime;
      let token = await commonFunction.getToken({
        _id: user._id,
        email: user.email,
      });
      user._doc.accessToken = token;
      return res.json(new response(user, responseMessage.LOGIN));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/socialLogin:
   *   post:
   *     tags:
   *       - USER
   *     description: login
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: socialLogin
   *         description: socialLogin
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/socialLogin'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async socialLogin(req, res, next) {
    const validationSchema = {
      email: Joi.string().email().optional().allow(''),
      socialId: Joi.string().required(),
      type: Joi.string().required(),
      deviceType: Joi.string().allow("").optional(),
      deviceToken: Joi.string().allow("").optional(),
      userType: Joi.string().allow("user", "brand").required(),
      lat: Joi.number().allow().optional(),
      long: Joi.number().allow().optional()
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      let validBody = await Joi.validate(req.body, validationSchema);
      const { email, socialId, type, deviceType, deviceToken, userType, long, lat } = validBody;
      let user;
      if (type == 'apple') {
        user = await findUser({ $or: [{ socialId: socialId }, { email: email }] });
        if (user) {
          if (user.userType !== 'user') {
            throw apiError.conflict("This account is already added as a brand.")
          };
        };
      } else {
        user = await userCheck(email);
        if (user) {
          if (user.userType !== 'user') {
            throw apiError.conflict("This account is already added as a brand.")
          };
        };
      }
      if (!user) {
        user = await createUser({
          socialId: socialId,
          email: email,
          type: type,
          deviceType: deviceType,
          deviceToken: deviceToken,
          verify: true,
          userType: userType,
          location: {
            type: 'Point',
            coordinates: [long || 0, lat || 0]
          }
        });
        delete user._doc.password;
        delete user._doc.deviceToken;
        delete user._doc.deviceType;
        let token = await commonFunction.getToken({
          _id: user._id,
          email: user.email,
        });
        user._doc.accessToken = token;
        return res.json(new response(user, responseMessage.LOGIN));
      } else {
        let updateObj = {
          socialId: socialId,
          type: type,
          verify: true,
        };
        if (deviceType && deviceToken) {
          updateObj.deviceType = deviceType;
          updateObj.deviceToken = deviceToken;
        }
        await updateUser({ _id: user._id }, { $set: updateObj });
        delete user._doc.password;
        delete user._doc.deviceToken;
        delete user._doc.deviceType;
        let token = await commonFunction.getToken({
          _id: user._id,
          email: user.email,
        });
        user._doc.accessToken = token;
        return res.json(new response(user, responseMessage.LOGIN));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /user/brandSocialLogin:
 *   post:
 *     tags:
 *       - USER
 *     description: login
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: socialLogin
 *         description: socialLogin
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/socialLogin'
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async brandSocialLogin(req, res, next) {
    const validationSchema = {
      email: Joi.string().email().optional().allow(''),
      socialId: Joi.string().required(),
      type: Joi.string().required(),
      deviceType: Joi.string().allow("").optional(),
      deviceToken: Joi.string().allow("").optional(),
      userType: Joi.string().allow("user", "brand").required(),
      lat: Joi.number().allow().optional(),
      long: Joi.number().allow().optional()
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      let validBody = await Joi.validate(req.body, validationSchema);
      const { email, socialId, type, deviceType, deviceToken, userType, lat, long } = validBody;
      let user;
      if (type == 'apple') {
        user = await findUser({ $or: [{ socialId: socialId }, { email: email }] });
        if (user) {
          if (user.userType !== 'brand') {
            throw apiError.conflict("This account is already added as a user.")
          };
        };
      } else {
        user = await userCheck(email);
        if (user) {
          if (user.userType !== 'brand') {
            throw apiError.conflict("This account is already added as a user.")
          };
        };
      }
      if (!user) {
        user = await createUser({
          socialId: socialId,
          email: email,
          type: type,
          deviceType: deviceType,
          deviceToken: deviceToken,
          verify: true,
          userType: userType,
          location: {
            type: 'Point',
            coordinates: [long || 0, lat || 0]
          }
        });
        delete user._doc.password;
        delete user._doc.deviceToken;
        delete user._doc.deviceType;
        let token = await commonFunction.getToken({
          _id: user._id,
          email: user.email,
        });
        user._doc.accessToken = token;
        return res.json(new response(user, responseMessage.LOGIN));
      } else {
        let updateObj = {
          socialId: socialId,
          type: type,
          verify: true,
        };
        if (deviceType && deviceToken) {
          updateObj.deviceType = deviceType;
          updateObj.deviceToken = deviceToken;
        }
        await updateUser({ _id: user._id }, { $set: updateObj });
        delete user._doc.password;
        delete user._doc.deviceToken;
        delete user._doc.deviceType;
        let token = await commonFunction.getToken({
          _id: user._id,
          email: user.email,
        });
        user._doc.accessToken = token;
        return res.json(new response(user, responseMessage.LOGIN));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/profile:
   *   get:
   *     tags:
   *       - USER
   *     description: profile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async profile(req, res, next) {
    try {
      let user = await findUser({ _id: req.userId, isDelete: false });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      return res.json(new response(user, responseMessage.USER_DETAILS));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/edit:
   *   put:
   *     tags:
   *       - USER
   *     description: Edit profile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: edit
   *         description: edit user profile
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/edit'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async edit(req, res, next) {
    let schema = {
      name: Joi.string().allow(null).allow("").optional(),
      email: Joi.string().allow(null).allow("").optional(),
      userName: Joi.string().allow(null).allow("").optional(),
      profilePic: Joi.string().allow(null).allow("").optional(),
      gender: Joi.string()
        .allow(null)
        .allow("male", "female", "other", "")
        .optional(),
      city: Joi.string().allow("").optional(),
      yearFounded: Joi.string().allow("").optional(),
      profileComplete: Joi.boolean().optional()
    };
    try {
      const validBody = await Joi.validate(req.body, schema);
      console.log("dsdsdsds", validBody)
      let user = await findUser({ _id: req.userId, isDelete: false });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (validBody.userName) {
        let check = await userCheck(validBody.userName);
        if (check) {
          throw apiError.conflict(responseMessage.USERNAME_EXISTS);
        }
      }
      if (validBody.email) {
        let check = await userCheck(validBody.email);
        if (check) {
          throw apiError.conflict(responseMessage.EMAIL_EXIST);
        }
        // const otpTime = Date.now() + 180000;
        // const otp = await commonFunction.getOTP();
        // const link = `${config.get('baseURL')}/user/verify/${validBody.email}/${otp}`;
        // await commonFunction.sendEmail(validBody.email, 'Email Verification', link);
        // // await updateUser({ _id: user._id }, {
        // //     $set: {
        // //         otp: otp,
        // //         otpTime: otpTime
        // //     }
        // // });
        await updateUser(
          {
            _id: user._id,
          },
          {
            $set: { email: validBody.email },
          }
        );
        // return res.json(new response({ send: true }, responseMessage.LINK_SEND));
      }
      user = await updateUser(
        {
          _id: user._id,
        },
        {
          $set: validBody,
        }
      );
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      return res.json(new response(user, responseMessage.USER_UPDATED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/forgot:
   *   post:
   *     tags:
   *       - USER
   *     description: Forgot password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: Forgot Password
   *         description: Enter email
   *         in: body
   *         required: true
   *         schema:
   *           properties:
   *             email:
   *               type: string
   *             userType:
   *               type: string
   *               enum: ["user", "brand"]
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async forgot(req, res, next) {
    let schema = {
      email: Joi.string().email().required(),
      userType: Joi.string().required(),
    };
    try {
      const validBody = await Joi.validate(req.body, schema);
      const { email, userType } = validBody;
      let user = await findUser({
        email: email,
        userType: userType,
        isDelete: false,
      });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const otpTime = Date.now() + 180000;
      const otp = await commonFunction.getOTP();
      const link = `${config.get("baseURL")}/user/verify/${user._id}/${otp}`;
      let html = await resetPasswordTemplate({ user, link });
      await commonFunction.sendEmail(email, "Forgot Password", html);
      user = await updateUser(
        {
          _id: user._id,
        },
        {
          $set: {
            otp: otp,
            otpTime: otpTime,
          },
        }
      );
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      delete user._doc.otp;
      delete user._doc.otpTime;
      return res.json(new response(user, responseMessage.LINK_SEND));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verify/{email}/{otp}:
   *   get:
   *     tags:
   *       - USER
   *     description: Verify link
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: Enter email
   *         in: path
   *         required: true
   *       - name: otp
   *         description: Enter otp
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verify(req, res, next) {
    let schema = {
      _id: Joi.string().required(),
      otp: Joi.string().allow("").required(),
    };
    try {
      const validBody = await Joi.validate(req.params, schema);
      const { _id, otp } = validBody;
      let user = await findUser({ _id: _id, isDelete: false });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (user.otp !== otp) {
        throw apiError.badRequest(responseMessage.INVALID_LINK);
      }
      if (Number(Date.now()) > Number(user.otpTime)) {
        throw apiError.badRequest(responseMessage.LINK_EXPIRED);
      }
      user = await updateUser(
        {
          _id: user._id,
        },
        {
          $set: {
            otp: "",
            otpTime: 0,
            verify: true,
          },
        }
      );
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      delete user._doc.otp;
      delete user._doc.otpTime;
      return res.render("forgotPassword/forgotPassword", {
        title: "forgot Password",
        _id: user._id,
      });
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resetPassword:
   *   put:
   *     tags:
   *       - USER
   *     description: Reset password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: Reset Password
   *         description: Enter email and password
   *         in: body
   *         required: true
   *         schema:
   *           properties:
   *             email:
   *               type: string
   *             password:
   *               type: string
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async resetPassword(req, res, next) {
    let schema = {
      newPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    };
    try {
      const validBody = await Joi.validate(req.body, schema);
      const validQuery = await Joi.validate(req.query, {
        _id: Joi.string().required(),
      });
      const { newPassword } = validBody;
      const { _id } = validQuery;
      let user = await findUser({ _id: _id });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      // if (bcrypt.compareSync(newPassword, user.password)) {
      //     throw apiError.badRequest(responseMessage.OLD_PASS);
      // };
      user = await updateUser(
        {
          _id: user._id,
        },
        {
          $set: {
            password: bcrypt.hashSync(newPassword),
          },
        }
      );
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      delete user._doc.otp;
      delete user._doc.otpTime;
      return res.render("forgotPassword/commonMessage", {
        title: "Forgot Password",
        successMessage: "Your password is successfully changed",
        projectName: "Huemanity",
      });
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/changedPass:
   *   put:
   *     tags:
   *       - USER
   *     description: Change Password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Enter token
   *         in: header
   *         required: true
   *       - name: Changed Password
   *         description: Enter old password and new password
   *         in: body
   *         required: true
   *         schema:
   *           properties:
   *             oldPassword:
   *               type: string
   *             password:
   *               type: string
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async changedPass(req, res, next) {
    let schema = {
      oldPassword: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      const validBody = await Joi.validate(req.body, schema);
      const { oldPassword, password } = validBody;
      let user = await findUser({ _id: req.userId, isDelete: false });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(oldPassword, user.password)) {
        throw apiError.badRequest(responseMessage.OLD_WRONG);
      }
      if (bcrypt.compareSync(password, user.password)) {
        throw apiError.badRequest(responseMessage.OLD_PASS);
      }
      user = await updateUser(
        {
          _id: user._id,
        },
        {
          $set: {
            password: bcrypt.hashSync(password),
          },
        }
      );
      delete user._doc.password;
      delete user._doc.deviceToken;
      delete user._doc.deviceType;
      delete user._doc.otp;
      delete user._doc.otpTime;
      return res.json(new response(user, responseMessage.PWD_CHANGED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/categories:
   *   get:
   *     tags:
   *       - USER
   *     description: Categories list
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async categories(req, res, next) {
    try {
      let data = await listCategories();
      return res.json(new response(data, responseMessage.USER_UPDATED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/sendQuery:
   *   post:
   *     tags:
   *       - USER
   *     description: Contact Us
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Enter token
   *         in: header
   *         required: true
   *       - name: Contact Us
   *         description: Contact us params
   *         in: body
   *         required: true
   *         schema:
   *           properties:
   *             name:
   *               type: string
   *             email:
   *               type: string
   *             subject:
   *               type: string
   *             comment:
   *               type: string
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async sendQuery(req, res, next) {
    let schema = {
      name: Joi.string().required(),
      email: Joi.string().required(),
      subject: Joi.string().required(),
      comment: Joi.string().required(),
    };
    try {
      const body = await Joi.validate(req.body, schema);
      const { name, email, subject, comment } = body;
      let data = await createQuery({
        name: name,
        email: email,
        subject: subject,
        comment: comment,
      });
      return res.json(new response(data, responseMessage.DATA_SAVED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getColors:
   *   post:
   *     tags:
   *       - USER
   *     description: Get colors
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: file0
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: true
   *       - name: file1
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file2
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file3
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file4
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file5
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file6
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *       - name: file7
   *         description: Enter file
   *         in: formData
   *         type: file
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getColors(req, res, next) {

    // try {
    //   let image = [];
    //   let array = [];

    //   for (let i = 0; i < 8; i++) {
    //     const fileKey = `file${i}`;
    //     if (req.files[fileKey]) {
    //       const file = req.files[fileKey];
    //       const [url, data] = await Promise.all([
    //         commonFunction.uploadImage(file),
    //         commonFunction.readImageAndExtractColors(file.tempFilePath),
    //         // commonFunction.extractColorsFromImage(
    //         //   file.tempFilePath,
    //         //   file.mimetype,
    //         //   file.name
    //         // ),
    //       ]);
    //       data[`image${i + 1}`] = url;
    //       array.push(data);
    //       image.push(url);
    //     }
    //   }

    //   const uniqueHexValues = new Set();
    //   array.forEach((item) => {
    //     Object.values(item).forEach((value) => {
    //       if (typeof value === "string" && value.match(/^#[0-9a-fA-F]{6}$/)) {
    //         uniqueHexValues.add(value);
    //       }
    //     });
    //   });
    //   const uniqueHexArray = Array.from(uniqueHexValues);
    //   array.push({ uniqueColors: uniqueHexArray });

    //   return res.json({
    //     image: image,
    //     uniqueColors: uniqueHexArray,
    //   });
    // } catch (error) {
    //   console.error(error);
    //   return next(error);
    // }

    try {
      let image = [];
      let array = [];

      if (req.files.file0) {
        const file = req.files.file0;
        let [url, data] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          //   commonFunction.extractColorsFromImage(
          //     file.tempFilePath,
          //     file.mimetype,
          //     file.name
          //   ),
        ]);

        data.image1 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file1) {
        const file = req.files.file1;
        let [url, data, data1] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          // commonFunction.extractColorsFromImage(
          //   file.tempFilePath,
          //   file.mimetype,
          //   file.name
          // ),
        ]);
        data.image2 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file2) {
        const file = req.files.file2;
        let [url, data, data1] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          // commonFunction.extractColorsFromImage(
          //   file.tempFilePath,
          //   file.mimetype,
          //   file.name
          // ),
        ]);
        data.image3 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file3) {
        const file = req.files.file3;
        let [url, data] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          // commonFunction.extractColorsFromImage(
          //   file.tempFilePath,
          //   file.mimetype,
          //   file.name
          // ),
        ]);
        data.image4 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file4) {
        const file = req.files.file4;
        let [url, data, data1] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          commonFunction.extractColorsFromImage(
            file.tempFilePath,
            file.mimetype,
            file.name
          ),
        ]);
        data.image5 = url;
        array.push(data, data1);
        image.push(url);
      }
      if (req.files.file5) {
        const file = req.files.file5;
        let [url, data] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          commonFunction.extractColorsFromImage(
            file.tempFilePath,
            file.mimetype,
            file.name
          ),
        ]);
        data.image6 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file6) {
        const file = req.files.file6;
        let [url, data] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          // commonFunction.extractColorsFromImage(
          //   file.tempFilePath,
          //   file.mimetype,
          //   file.name
          // ),
        ]);
        data.image7 = url;
        array.push(data);
        image.push(url);
      }
      if (req.files.file7) {
        const file = req.files.file7;
        let [url, data] = await Promise.all([
          commonFunction.uploadImage(file),
          commonFunction.readImageAndExtractColors(file.tempFilePath, file.mimetype),
          // commonFunction.extractColorsFromImage(
          //   file.tempFilePath,
          //   file.mimetype,
          //   file.name
          // ),
        ]);
        data.image8 = url;
        array.push(data);
        image.push(url);
      }
      const uniqueHexValues = new Set();
      console.log(array);
      array.forEach((item) => {
        Object.values(item).forEach((value) => {
          if (typeof value === "string" && value.match(/^#[0-9a-fA-F]{6}$/)) {
            uniqueHexValues.add(value);
          }
        });
      });
      const uniqueHexArray = Array.from(uniqueHexValues);
      console.log(uniqueHexArray);
      array.push({ uniqueColors: uniqueHexArray });
      return res.json(
        new response(
          { image: image, uniqueColors: uniqueHexArray },
          responseMessage.UPLOAD_SUCCESS
        )
      );
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/addCategory:
   *   post:
   *     tags:
   *       - USER
   *     description: Add category
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: Create catgory
   *         description: Create catgory
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/addCategory'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async addCategory(req, res, next) {
    let schema = {
      name: Joi.string().allow("").required(),
    };
    try {
      let body = await Joi.validate(req.body, schema);
      const { name } = body;
      let data = await findCategory({ name: name });
      if (data) {
        throw apiError.conflict(responseMessage.ALREADY_EXITS);
      }
      data = await createCategory({
        name: name,
      });
      return res.json(new response(data, responseMessage.DATA_SAVED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/configList:
   *   get:
   *     tags:
   *       - USER
   *     description: Wardrobe config List
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async configList(req, res, next) {
    try {
      let [categories, configList] = await Promise.all([
        listCategories(),
        findConfig(),
      ]);
      let style, weather, occasion;
      if (configList) {
        style = configList.style;
        weather = configList.weather;
        occasion = configList.occasion;
      } else {
        style = [];
        weather = [];
        occasion = [];
      }
      let obj = {
        categories: categories,
        style: style,
        weather: weather,
        occasion: occasion,
      };
      return res.json(new response(obj, responseMessage.DATA_FOUND));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/createOutfit:
   *   post:
   *     tags:
   *       - USER
   *     description: Create Outfit
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: Create Outfit
   *         description: Create Outfit
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/outfit'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async createOutfit(req, res, next) {
    const validationSchema = {
      name: Joi.string().allow("").required(),
      colors: Joi.array().items(Joi.string()).required(),
      category: Joi.string().allow("").required(),
      image: Joi.required(),
      ageStart: Joi.number().required(),
      ageEnd: Joi.number().required(),
      priceStart: Joi.number().required(),
      priceEnd: Joi.number().required(),
      style: Joi.array().items(Joi.string()).required(),
      weather: Joi.array().items(Joi.string()).required(),
      occasion: Joi.array().items(Joi.string()).required(),
      gender: Joi.string().required().valid("Male", "Female", "Non-binary"),
      isPrivate: Joi.boolean().required()
    };
    try {
      const body = await Joi.validate(req.body, validationSchema);
      const {
        name,
        colors,
        category,
        image,
        ageStart,
        ageEnd,
        priceStart,
        priceEnd,
        style,
        weather,
        occasion,
        price,
        gender,
        isPrivate
      } = body;
      const newColors = colors.filter(
        (value, index, arr) => arr.indexOf(value) === index
      );
      console.log(newColors);
      const data = await createOutfit({
        name: name,
        colors: newColors,
        category: category,
        image: image,
        ageStart: ageStart,
        ageEnd: ageEnd,
        priceStart: priceStart,
        priceEnd: priceEnd,
        style: style,
        weather: weather,
        occasion: occasion,
        userId: req.userId,
        price: price,
        gender: gender,
        isPrivate: isPrivate,
        location: req.userDetails.location
      });
      return res.json(new response(data, responseMessage.DATA_SAVED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };


  /**
  * @swagger
  * /user/updateOutfit:
  *   put:
  *     tags:
  *       - USER
  *     description: Update Outfit
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: token
  *         description: set token in header
  *         in: header
  *         required: true
  *       - name: Create Outfit
  *         description: Create Outfit
  *         in: body
  *         required: true
  *         schema:
  *           $ref: '#/definitions/updateOutfit'
  *     responses:
  *       200:
  *         description: Returns success message
  */
  async updateOutfit(req, res, next) {
    // const validationSchema = {
    //   _id: Joi.string().required()
    // };
    try {
      // const body = await Joi.validate(req.body, validationSchema);
      const {
        _id
      } = req.body;
      let data = await findOutFit(_id);
      if (!data) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      if (req.body.colors) {
        const newColors = req.body.colors.filter(
          (value, index, arr) => arr.indexOf(value) === index
        );
        console.log(newColors);
        req.body.colors = newColors;
      };
      data = await updateOutfit(
        {
          _id: data._id
        }, {
        $set: req.body
      });
      return res.json(new response(data, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };

  /**
* @swagger
* /user/deleteOutfit:
*   delete:
*     tags:
*       - USER
*     description: Delete Outfit
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: _id
*         description: set _id in query
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async deleteOutfit(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required()
    };
    try {
      const body = await Joi.validate(req.query, validationSchema);
      const {
        _id
      } = body;
      let data = await findOutFit(_id);
      if (!data) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      data = await deleteOutfit(
        {
          _id: data._id
        });
      await wardrobeModel.deleteMany({ outfitId: data._id });
      return res.json(new response(data, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };

  /**
 * @swagger
 * /user/publicOutfit:
 *   put:
 *     tags:
 *       - USER
 *     description: Create Outfit
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: set token in header
 *         in: header
 *         required: true
 *       - name: _id Outfit
 *         description: _id of Outfit
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async publicOutfit(req, res, next) {
    const schema = {
      _id: Joi.string().required(),
    };
    try {
      const params = await Joi.validate(req.query, schema);
      const {
        _id
      } = params;
      let msg;
      let data = await findOutFit(_id);
      if (!data) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      if (data.isPrivate == true) {
        data = await updateOutfit({ _id: data._id }, { $set: { isPrivate: false } });
        msg = "Outfit is public successfully."
      } else {
        data = await updateOutfit({ _id: data._id }, { $set: { isPrivate: true } });
        msg = "Outfit is private successfully."
      };
      return res.json(new response(data, msg));
    } catch (error) {
      return next(error)
    }
  };

  /**
   * @swagger
   * /user/home:
   *   get:
   *     tags:
   *       - USER
   *     description: Get Home list
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async home(req, res, next) {
    try {
      let data = await listCategories();
      if (data.length !== 0) {
        for (let d of data) {
          let [outfits, counts] = await Promise.all([
            outfitList({ category: d._id, userId: req.userId }),
            outfitCounts({ category: d._id, userId: req.userId }),
          ]);
          d._doc.outfits = outfits;
          d._doc.outfitCounts = counts;
        }
      }
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/favourite/{_id}:
   *   get:
   *     tags:
   *       - USER
   *     description: Fav/Unfav outfit
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: _id
   *         description: set _id in params
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async favourite(req, res, next) {
    const schema = {
      _id: Joi.string().required(),
    };
    try {
      const path = await Joi.validate(req.params, schema);
      const { _id } = path;
      let check;
      check = await findFav({ outfitId: _id, userId: req.userId });
      if (check) {
        check = await removeFav({ _id: check._id });
        return res.json(new response(check, responseMessage.UNFAV_SUCCESS));
      } else {
        check = await addFav({
          outfitId: _id,
          userId: req.userId,
        });
        return res.json(new response(check, responseMessage.FAV_SUCCESS));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/favouriteList:
   *   get:
   *     tags:
   *       - USER
   *     description: Get favourite list
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: page
   *         description: page
   *         in: query
   *         example: 0
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         example: 10
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async favouriteList(req, res, next) {
    const schema = {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      let query = await Joi.validate(req.query, schema);
      let data;
      query.userId = req.userId;
      data = await paginateFav(query);
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/explore:
   *   post:
   *     tags:
   *       - USER
   *     description: explore
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: explore
   *         description: explore
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/explore'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async explore(req, res, next) {
    const schema = {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      category: Joi.string().optional(),
      search: Joi.string().optional().allow(null, ""),
      style: Joi.array().items(Joi.string().allow(null, "")).optional(),
      weather: Joi.array().items(Joi.string().allow(null, "")).optional(),
      occasion: Joi.array().items(Joi.string().allow(null, "")).optional(),
      priceStart: Joi.string().optional().allow(null, ""),
      priceEnd: Joi.string().optional().allow(null, ""),
      ageStart: Joi.string().optional().allow(null, ""),
      ageEnd: Joi.string().optional().allow(null, ""),
      gender: Joi.string().optional().allow(null, ""),
      lat: Joi.number().optional().allow(null),
      long: Joi.number().optional().allow(null),
    };
    try {
      const body = await Joi.validate(req.body, schema);
      console.log(body);
      let data = await exploreAggregate(body, req.userId);
      console.log(data)
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @swagger
   * /user/outfitList:
   *   get:
   *     tags:
   *       - USER
   *     description: outfitList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: page
   *         description: set page in header
   *         in: query
   *         example: 0
   *         required: false
   *       - name: limit
   *         description: set limit in query
   *         in: query
   *         example: 10
   *         required: false
   *       - name: category
   *         description: set category in query
   *         in: query
   *         example: 6536515badae5c31c42df982
   *         required: false
   *       - name: userId
   *         description: set userId in query
   *         in: query
   *         example: 6536515badae5c31c42df982
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async outfitList(req, res, next) {
    const schema = {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      category: Joi.string().allow("").optional(),
      userId: Joi.string().allow("").optional(),
    };
    try {
      const body = await Joi.validate(req.query, schema);
      let data = await paginateOutfit(body);
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/likeOutfits:
   *   put:
   *     tags:
   *       - USER
   *     description: outfitList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: set token in header
   *         in: header
   *         required: true
   *       - name: outFitId
   *         description: set outfit Id
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             outFitId:
   *               type: string
   *               example: "6536515badae5c31c42df982"
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async likeOutfits(req, res, next) {
    console.log(req.userId);
    const schema = {
      outFitId: Joi.string().allow("").optional(),
    };
    try {
      const body = await Joi.validate(req.body, schema);
      const check = await findOutFit(body.outFitId);
      if (!check) {
        throw apiError.notFound(ERROR_MESSAGES.OUTFIT_NOT_FOUND)
      };
      const data = await likeOutFit(check, req.userId);
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  };

  /**
 * @swagger
 * /user/wardrobe/{_id}:
 *   put:
 *     tags:
 *       - USER
 *     description: add or remove outfit from wardrobe
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: set token in header
 *         in: header
 *         required: true
 *       - name: _id
 *         description: set _id in path
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async wardrobe(req, res, next) {
    const schema = {
      _id: Joi.string().required()
    };
    try {
      const params = await Joi.validate(req.params, schema);
      const {
        _id
      } = params;
      let msg;
      let outfit = await findOutFit(_id);
      if (!outfit) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      let data = await findWardrobe({ userId: req.userId, outfitId: outfit._id });
      if (data) {
        data = await delWardobe({ _id: data._id });
        msg = 'Outfit has been removed from the wardrobe';
      }
      else {
        data = await createWardrobe({ userId: req.userId, outfitId: outfit._id });
        msg = 'Outfit has been added to the wardrobe';
      };
      return res.json(new response(data, msg));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/wardrobeList:
*   get:
*     tags:
*       - USER
*     description: Wardrobe List
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: page
*         description: set page in query
*         in: query
*         required: false
*       - name: limit
*         description: set limit in query
*         in: query
*         required: false
*       - name: search
*         description: set search in query
*         in: query
*         required: false
*       - name: collectionId
*         description: set collectionId in query
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async wardrobeList(req, res, next) {
    const schema = {
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      search: Joi.string().optional().allow(""),
      collectionId: Joi.string().required()
    };
    try {
      const body = await Joi.validate(req.query, schema);
      let data = await wardrobeAggregate(body, req.userId);
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  };

  /**
* @swagger
* /user/viewOutfit:
*   get:
*     tags:
*       - USER
*     description: View Outfit
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: _id
*         description: set _id in query
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async viewOutfit(req, res, next) {
    try {
      let data = await checkOutfit({ _id: req.query._id });
      if (!data) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
      };
      console.log(data.views.includes(String(req.userId)))
      if (data.views.includes(String(req.userId)) == false) {
        await updateOutfit({ _id: data._id }, { $push: { views: String(req.userId) } });
      }
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  };

  /**
 * @swagger
 * /user/uploadFile:
 *   post:
 *     tags:
 *       - USER
 *     description: uploadFile
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: set token in header
 *         in: header
 *         required: true
 *       - name: files
 *         description: files in base64
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             fileArr:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   file:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type: 
 *                     type: string
 *                   height:
 *                     type: string
 *                   width: 
 *                     type: string
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async uploadFile(req, res, next) {
    try {
      const {
        fileArr
      } = req.body;
      if (fileArr.length == 0) {
        throw apiError.error(responseMessage.FIELD_REQUIRED)
      };
      let arr = [];
      for (const file of fileArr) {
        let url = await commonFunction.upload64(file.file, file.name, file.type);
        arr.push(
          {
            file: url,
            name: file.name,
            type: file.type,
            height: file.height,
            width: file.width
          }
        );
      };
      return res.json(new response(arr, responseMessage.UPLOAD_SUCCESS))
    } catch (error) {
      return next(error);
    }
  };

  /**
 * @swagger
 * /user/createCollection:
 *   post:
 *     tags:
 *       - COLLECTIONS
 *     description: createCollection
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: set token in header
 *         in: header
 *         required: true
 *       - name: Collection
 *         description: Collection param
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async createCollection(req, res, next) {
    const schema = {
      name: Joi.string().required()
    };
    try {
      const body = await Joi.validate(req.body, schema);
      const {
        name
      } = body;
      let data = await findCollection(
        {
          userId: req.userDetails._id,
          name: name
        }
      );
      if (data) {
        throw apiError.conflict("Collection already exists!")
      };
      data = await createCollection(
        {
          userId: req.userDetails._id,
          name: name
        }
      )
      return res.json(new response(data, responseMessage.DATA_SAVED));
    } catch (error) {
      return next(error);
    }
  };

  /**
* @swagger
* /user/removeCollection/{_id}:
*   delete:
*     tags:
*       - COLLECTIONS
*     description: removeCollection
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: _id
*         description: _id in param
*         in: path
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async removeCollection(req, res, next) {
    const schema = {
      _id: Joi.string().required()
    };
    try {
      const body = await Joi.validate(req.params, schema);
      const {
        _id
      } = body;
      let data = await findCollection(
        {
          userId: req.userDetails._id,
          _id: _id
        }
      );
      if (!data) {
        throw apiError.notFound("Collection doesnt exists!")
      };
      data = await remCollection(
        {
          _id: data._id
        }
      );
      await delAllWardobe({
        userId: req.userId,
        collectionId: data._id
      })
      return res.json(new response(data, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  };

  /**
* @swagger
* /user/listCollections:
*   get:
*     tags:
*       - COLLECTIONS
*     description: listCollection
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: _id
*         description: set _id of outfit
*         in: query
*         required: false
*       - name: page
*         description: set page 
*         in: query
*         required: false
*       - name: limit
*         description: set limit 
*         in: query
*         required: false
*       - name: search
*         description: set search 
*         in: query
*         required: false
*     responses:
*       200:
*         description: Returns success message
*/
  async listCollections(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        _id
      } = req.query;
      let data = await collectionList({ userId: req.userDetails._id });
      if (page && limit) {
        req.query.userId = req.userDetails._id
        data = await paginateCollectionList(req.query);
        for (let d of data.docs) {
          let wardrobe = await wardrobeModel.find({ collectionId: d._id }).populate([{ path: 'outfitId', populate: [{ path: "category" }, { path: 'userId', select: '-otp -otpTime -password' }] }]);
          d._doc.outfits = wardrobe;
        }
      }
      else {
        let query = { userId: req.userDetails._id };
        if (search) {
          query.name = { $regex: search, $options: "i" };
        };
        data = await collectionList(query);
        for (let d of data) {
          let wardrobe = await wardrobeModel.findOne({ collectionId: d._id, outfitId: _id });
          console.log(wardrobe)
          if (wardrobe) {
            d._doc.isSaved = true;
          } else {
            d._doc.isSaved = false;
          }
        }
      };
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/addOutfitToCollection:
*   post:
*     tags:
*       - COLLECTIONS
*     description: addOutfitToCollection
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: Collection
*         description: Collection param
*         in: body
*         required: true
*         schema:
*           type: object
*           properties:
*             _id:
*               type: string
*             collections:
*               type: array
*               items:
*                 type: string
*     responses:
*       200:
*         description: Returns success message
*/
  async addOutfitToCollection(req, res, next) {
    const schema = {
      _id: Joi.string().required(),
      collections: Joi.array().items(Joi.string()).required()
    };
    try {
      const body = await Joi.validate(req.body, schema);
      const {
        _id,
        collections
      } = body;
      let msg;
      let outfit = await findOutFit(_id);
      if (!outfit) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      let data = await findCollection({ _id: collections[0] });
      if (!data) {
        throw apiError.notFound("Collection not found!")
      };
      let check = await findWardrobe({ collectionId: data._id, userId: req.userDetails._id, outfitId: outfit._id });
      if (!check) {
        check = await createWardrobe({
          collectionId: data._id,
          outfitId: outfit._id,
          userId: req.userDetails._id
        });
        msg = 'Outfit has been added to the collection.';
      } else {
        check = await delWardobe({ _id: check._id });
        msg = 'Outfit has been removed from the collection.';
      };
      return res.json(new response(check, msg));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/removeOutfitToCollection:
*   delete:
*     tags:
*       - COLLECTIONS
*     description: removeOutfitToCollection
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: _id
*         description: _id param
*         in: query
*         required: true
*       - name: collectionId
*         description: collectionId param
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async removeOutfitToCollection(req, res, next) {
    const schema = {
      _id: Joi.string().required(),
      collectionId: Joi.string().required()
    };
    try {
      const body = await Joi.validate(req.query, schema);
      const {
        _id,
        collectionId
      } = body;
      let msg;
      let outfit = await findOutFit(_id);
      if (!outfit) {
        throw apiError.notFound(responseMessage.OUTFIT_NOT_FOUND)
      };
      let data = await findWardrobe({ userId: req.userId, outfitId: outfit._id, collectionId: collectionId });
      if (!data) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      };
      data = await delWardobe({ _id: data._id })
      msg = 'Outfit has been removed to the collection.';
      return res.json(new response(data, msg));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/suggestions:
*   post:
*     tags:
*       - COLLECTIONS
*     description: suggestions
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: recommendation
*         description: recommendation
*         in: body
*         required: true
*         schema:
*           properties:
*             category:
*               type: string
*             colors:
*               type: array
*               items:
*                 type: string
*     responses:
*       200:
*         description: Returns success message
*/
  async suggestions(req, res, next) {
    try {
      const {
        category,
        colors
      } = req.body;
      let data = await outfitList({ userId: { $ne: req.userId }, category: category });
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  };

  /**
* @swagger
* /user/notificationList:
*   get:
*     tags:
*       - NOTIFICATION
*     description: Notification List
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: page
*         description: page
*         in: query
*         required: false
*       - name: limit
*         description: limit
*         in: query
*         required: false
*     responses:
*       200:
*         description: Returns success message
*/
  async notificationList(req, res, next) {
    try {
      req.query.userId = req.userId;
      let data = await paginateNotification(req.query);
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/updateToken:
*   put:
*     tags:
*       - NOTIFICATION
*     description: updateToken
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*       - name: updateToken
*         description: updateToken
*         in: body
*         required: true
*         schema:
*           properties:
*             deviceType:
*               type: string
*             deviceToken:
*               type: string
*     responses:
*       200:
*         description: Returns success message
*/
  async updateToken(req, res, next) {
    try {
      const { deviceType, deviceToken } = req.body;
      await updateUser(
        {
          _id: req.userId
        },
        {
          $set: {
            deviceType: deviceType,
            deviceToken: deviceToken
          }
        }
      );
      return res.json(new response({}, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/deleteProfile:
*   delete:
*     tags:
*       - USER
*     description: deleteProfile
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async deleteProfile(req, res, next) {
    try {
      let user = await findUser({
        _id: req.userId
      });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      };
      await deleteUser(
        {
          _id: req.userId
        }
      );
      return res.json(new response({}, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error)
    }
  };

  /**
* @swagger
* /user/logout:
*   get:
*     tags:
*       - USER
*     description: logout
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: set token in header
*         in: header
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
  async logout(req, res, next) {
    try {
      await updateUser(
        {
          _id: req.userId
        },
        {
          $set: {
            deviceType: null,
            deviceToken: null
          }
        }
      );
      return res.json(new response({}, responseMessage.USER_LOGOUT))
    } catch (error) {
      return next(error);
    }
  };
}
export default new userController();
