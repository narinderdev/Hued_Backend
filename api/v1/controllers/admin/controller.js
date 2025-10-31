import Joi from "joi";
import _ from "lodash";
import apiError from '../../../../helper/apiError';
import { response } from '../../../../../assets/response';
import bcrypt from 'bcryptjs';
import responseMessage from '../../../../../assets/responseMessage';
import commonFunction from '../../../../helper/util';
import { adminServices } from '../../services/admin';
import { categoryServices } from '../../services/category';
import { queryServices } from "../../services/query";
import sendNotification from "../../../../globalNotification";
import { notificationService } from '../../services/notification';
import { userServices } from '../../services/user';
import outfit from "../../../../models/outfit";
import wardrobe from "../../../../models/wardrobe";
const {
    checkAdmin,
    updateAdmin,
    findAdmin,
    paginateUsers,
    paginateProducts,
    countUsers,
    countOutfits,
    deleteOutfit,
    listUsers
} = adminServices;
const {
    findCategory,
    createCategory,
    updateCategory,
    paginateCategorySearch,
    deleteCategory
} = categoryServices;

const {
    paginateQueries,
    findQuery,
    updateQuery
} = queryServices;

const {
    createNotification
} = notificationService;

const { updateUser, findUser, deleteUser } = userServices;


export class adminController {

    /**
     * @swagger
     * /admin/login:
     *   post:
     *     tags:
     *       - ADMIN
     *     description: login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: adminLogin
     *         description: adminLogin  
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/adminLogin'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async login(req, res, next) {
        var validationSchema = {
            email: Joi.string().required(),
            password: Joi.string().required(),
        }
        try {
            if (req.body.email) {
                req.body.email = (req.body.email).toLowerCase();
            }
            var results
            var validatedBody = await Joi.validate(req.body, validationSchema);
            const { email, password } = validatedBody;
            let userResult = await checkAdmin(email);
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }
            if (!bcrypt.compareSync(password, userResult.password)) {
                throw apiError.conflict(responseMessage.INCORRECT_LOGIN)
            } else {
                var token = await commonFunction.getToken({ _id: userResult._id, email: userResult.email });
                results = {
                    _id: userResult._id,
                    email: email,
                    token: token,
                }
            }
            return res.json(new response(results, responseMessage.LOGIN));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    };

    /**
* @swagger
* /admin/profile:
*   get:
*     tags:
*       - ADMIN
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
            let user = await findAdmin(req.userId);
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            };
            delete user._doc.password;
            return res.json(new response(user, responseMessage.DATA_FOUND));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    };

    /**
    * @swagger
    * /admin/edit:
    *   put:
    *     tags:
    *       - ADMIN
    *     description: Edit profile
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: set token in header
    *         in: header
    *         required: true
    *       - name: edit
    *         description: edit admin profile
    *         in: body
    *         required: true
    *         schema:
    *           $ref: '#/definitions/adminEdit'
    *     responses:
    *       200:
    *         description: Returns success message
    */
    async edit(req, res, next) {
        let schema = {
            name: Joi.string().allow('').optional(),
            profilePic: Joi.string().allow('').optional()
        }
        try {
            const validBody = await Joi.validate(req.body, schema);
            let user = await findAdmin(req.userId);
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            };
            user = await updateAdmin(
                {
                    _id: user._id
                },
                {
                    $set: validBody
                }
            );
            delete user._doc.password;
            return res.json(new response(user, responseMessage.UPDATE_SUCCESS));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    };

    /**
 * @swagger
 * /admin/changePass:
 *   put:
 *     tags:
 *       - ADMIN
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
    async changePass(req, res, next) {
        let schema = {
            oldPassword: Joi.string().required(),
            password: Joi.string().required(),
        };
        try {
            const validBody = await Joi.validate(req.body, schema);
            const { oldPassword, password } = validBody;
            let user = await findAdmin(req.userId);
            if (!user) {
                throw apiError.notFound(responseMessage.UNAUTHORIZED);
            }
            if (!bcrypt.compareSync(oldPassword, user.password)) {
                throw apiError.badRequest(responseMessage.OLD_WRONG);
            }
            if (bcrypt.compareSync(password, user.password)) {
                throw apiError.badRequest(responseMessage.OLD_PASS);
            }
            user = await updateAdmin(
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
            return res.json(new response(user, responseMessage.PWD_CHANGED));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    };

    /**
* @swagger
* /admin/addCategory:
*   post:
*     tags:
*       - CATEGORY MANAGEMENT
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
            name: Joi.string().allow('').required(),
        };
        try {
            let body = await Joi.validate(req.body, schema);
            const { name } = body;
            let data = await findCategory({ name: name });
            if (data) {
                throw apiError.conflict(responseMessage.ALREADY_EXITS);
            };
            data = await createCategory({
                name: name
            });
            return res.json(new response(data, responseMessage.DATA_SAVED));
        } catch (error) {
            console.log(error)
            return next(error);
        }
    };

    /**
 * @swagger
 * /admin/viewCategory:
 *   get:
 *     tags:
 *       - CATEGORY MANAGEMENT
 *     description: viewCategory
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: token
 *         in: header
 *         required: true
 *       - name: _id
 *         description: _id 
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Returns success message
 */
    async viewCategory(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required()
        }
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema)
            const { _id } = validatedBody
            let data = await findCategory({ _id: _id });
            if (!data) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            } else {
                return res.json(new response(data, responseMessage.DATA_FOUND));
            };
        } catch (error) {
            return next(error)
        }
    };

    /**
     * @swagger
     * /admin/editCategory:
     *   put:
     *     tags:
     *       - CATEGORY MANAGEMENT
     *     description: editCategory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id 
     *         in: query
     *         required: true
     *       - name: edit catgory
     *         description: edit catgory
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/addCategory'
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async editCategory(req, res, next) {
        const validSchema = {
            name: Joi.string().optional()
        }
        try {
            const validateBody = await Joi.validate(req.body, validSchema);
            let data = await findCategory({ _id: req.query._id })
            if (!data) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            else {
                let change = await updateCategory({ _id: data._id }, validateBody)
                return res.json(new response(change, responseMessage.UPDATE_SUCCESS))
            };
        } catch (error) {
            return next(error)
        }
    };

    /**
     * @swagger
     * /admin/deleteCategory:
     *   delete:
     *     tags:
     *       - CATEGORY MANAGEMENT
     *     description: deleteCategory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: Admin token
     *         in: header
     *         required: true
     *       - name: _id
     *         description: _id 
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async deleteCategory(req, res, next) {
        const validSchema = {
            _id: Joi.string().required()
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            const { _id } = validBody;
            let data = await findCategory({ _id: _id })
            if (!data) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND)
            }
            else {
                let update = await deleteCategory({ _id: data._id })
                return res.json(new response(update, responseMessage.DELETE_SUCCESS))
            };
        } catch (error) {
            return next(error)
        }
    };

    /**
     * @swagger
     * /admin/categoryList:
     *   get:
     *     tags:
     *       - CATEGORY MANAGEMENT
     *     description: categoryList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token 
     *         description: token.
     *         in: header
     *         required: true
     *       - name: search
     *         description: search using category name.
     *         in: query
     *         required: false
     *       - name: fromDate
     *         description: fromDate.
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate.
     *         in: query
     *         required: false
     *       - name: page
     *         description: fromDate.
     *         in: query
     *         required: false
     *       - name: limit
     *         description: limit.
     *         in: query
     *         required: false
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async categoryList(req, res, next) {
        const validSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.optional(),
            limit: Joi.optional(),
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await paginateCategorySearch(validBody)
            return res.json(new response(data, responseMessage.DATA_FOUND))
        } catch (error) {
            return next(error)
        }
    };

    /**
 * @swagger
 * /admin/userList:
 *   get:
 *     tags:
 *       - ADMIN
 *     description: userList
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token 
 *         description: token.
 *         in: header
 *         required: true
 *       - name: search
 *         description: search using user name.
 *         in: query
 *         required: false
 *       - name: fromDate
 *         description: fromDate.
 *         in: query
 *         required: false
 *       - name: toDate
 *         description: toDate.
 *         in: query
 *         required: false
 *       - name: page
 *         description: fromDate.
 *         in: query
 *         required: false
 *       - name: limit
 *         description: limit.
 *         in: query
 *         required: false
 *     responses:
 *       200:
 *         description: Returns success message
 */
    async userList(req, res, next) {
        const validSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.optional(),
            limit: Joi.optional()
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await paginateUsers(validBody, "user")
            return res.json(new response(data, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/brandList:
*   get:
*     tags:
*       - ADMIN
*     description: brandList
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: search
*         description: search using brand name.
*         in: query
*         required: false
*       - name: fromDate
*         description: fromDate.
*         in: query
*         required: false
*       - name: toDate
*         description: toDate.
*         in: query
*         required: false
*       - name: page
*         description: fromDate.
*         in: query
*         required: false
*       - name: limit
*         description: limit.
*         in: query
*         required: false
*     responses:
*       200:
*         description: Returns success message
*/
    async brandList(req, res, next) {
        const validSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.optional(),
            limit: Joi.optional()
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await paginateUsers(validBody, "brand")
            return res.json(new response(data, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error)
        }
    };


    /**
* @swagger
* /admin/productList:
*   get:
*     tags:
*       - ADMIN
*     description: productList
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: search
*         description: search using product name.
*         in: query
*         required: false
*       - name: fromDate
*         description: fromDate.
*         in: query
*         required: false
*       - name: toDate
*         description: toDate.
*         in: query
*         required: false
*       - name: page
*         description: fromDate.
*         in: query
*         required: false
*       - name: limit
*         description: limit.
*         in: query
*         required: false
*     responses:
*       200:
*         description: Returns success message
*/
    async productList(req, res, next) {
        const validSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.optional(),
            limit: Joi.optional(),
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await paginateProducts(validBody)
            return res.json(new response(data, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/deleteProduct:
*   delete:
*     tags:
*       - ADMIN
*     description: deleteProduct
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: _id
*         description: _id od product.
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
    async deleteProduct(req, res, next) {
        const validSchema = {
            _id: Joi.string().required()
        };
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await deleteOutfit({ _id: validBody._id });
            if (!data) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            };
            return res.json(new response(data, responseMessage.DELETE_SUCCESS));
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/dashboard:
*   get:
*     tags:
*       - ADMIN
*     description: dashboard
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
    async dashboard(req, res, next) {
        try {
            let [user, brand, product] = await Promise.all([
                countUsers({ userType: 'user', isDelete: false }),
                countUsers({ userType: 'brand', isDelete: false }),
                countOutfits({})
            ])
            return res.json(new response({
                user: user,
                brand: brand,
                product: product
            }, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error)
        }
    };

    /**
 * @swagger
 * /admin/queryList:
 *   get:
 *     tags:
 *       - ADMIN
 *     description: queryList
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token 
 *         description: token.
 *         in: header
 *         required: true
 *       - name: status
 *         description: status.
 *         in: query
 *         enum: ['pending','closed']
 *         required: false
 *       - name: search
 *         description: search using user name.
 *         in: query
 *         required: false
 *       - name: fromDate
 *         description: fromDate.
 *         in: query
 *         required: false
 *       - name: toDate
 *         description: toDate.
 *         in: query
 *         required: false
 *       - name: page
 *         description: fromDate.
 *         in: query
 *         required: false
 *       - name: limit
 *         description: limit.
 *         in: query
 *         required: false
 *     responses:
 *       200:
 *         description: Returns success message
 */
    async queryList(req, res, next) {
        const validSchema = {
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            status: Joi.string().optional(),
            page: Joi.optional(),
            limit: Joi.optional()
        }
        try {
            const validBody = await Joi.validate(req.query, validSchema)
            let data = await paginateQueries(validBody)
            return res.json(new response(data, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/closeQuery/{_id}:
*   put:
*     tags:
*       - ADMIN
*     description: closeQuery/{_id}
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: _id
*         description: _id.
*         in: path
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
    async closeQuery(req, res, next) {
        const schema = {
            _id: Joi.string().required()
        };
        try {
            const param = await Joi.validate(req.params, schema);
            const {
                _id
            } = param;
            let data = await findQuery({ _id: _id });
            if (!data) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            };
            data = await updateQuery({ _id: data._id }, { $set: { status: 'closed' } });
            return res.json(new response(data, 'Closed successfully.'));
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/sendNotifications:
*   post:
*     tags:
*       - ADMIN
*     description: sendNotifications
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: Notification
*         description: Notification param
*         in: body
*         required: true
*         schema:
*           properties:
*             userType:
*               type: string
*               example: "user or brand"
*             title:
*               type: string
*             message:
*               type: string
*     responses:
*       200:
*         description: Returns success message
*/
    async sendNotifications(req, res, next) {
        const schema = {
            userType: Joi.string().required(),
            title: Joi.string().allow('user', 'brand').required(),
            message: Joi.string().required()
        };
        try {
            const body = await Joi.validate(req.body, schema);
            const {
                message,
                title,
                userType
            } = body;
            let arr = [];
            if (userType == 'user') {
                let users = await listUsers({ userType: 'user' });
                if (!users.length) {
                    throw apiError.notFound("Users not found!");
                };
                for (let u of users) {
                    let obj = {
                        toId: u._id,
                        message: message,
                        title: title,
                        deviceToken: u.deviceToken
                    };
                    arr.push(createNotification(obj), sendNotification(obj));
                };
            } else {
                let users = await listUsers({ userType: 'brand' });
                if (!users.length) {
                    throw apiError.notFound("Brands not found!");
                };
                for (let u of users) {
                    let obj = {
                        toId: u._id,
                        message: message,
                        title: title,
                        deviceToken: u.deviceToken
                    };
                    arr.push(createNotification(obj), sendNotification(obj));
                };
            };
            await Promise.all(arr)
            return res.json(new response({}, "Notification send successfully"));
        } catch (error) {
            console.log(error)
            return next(error)
        }
    };

    /**
* @swagger
* /admin/enableDisabledUser:
*   put:
*     tags:
*       - ADMIN
*     description: enableDisabledUser
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: _id
*         description: _id of user 
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
    async enableDisabledUser(req, res, next) {
        try {
            const { _id } = req.query;
            let user;
            user = await findUser(
                { _id: _id });
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            };
            if (user.isBlock == false) {
                await updateUser(
                    { _id: user._id },
                    { $set: { isBlock: true } });
                return res.json(new response({}, responseMessage.USER_BLOCKED));
            }
            else {
                await updateUser(
                    { _id: user._id },
                    { $set: { isBlock: false } });
                return res.json(new response({}, responseMessage.USER_ACTIVATED));
            };
        } catch (error) {
            return next(error)
        }
    };

    /**
* @swagger
* /admin/deleteUser:
*   delete:
*     tags:
*       - ADMIN
*     description: deleteUser
*     produces:
*       - application/json
*     parameters:
*       - name: token 
*         description: token.
*         in: header
*         required: true
*       - name: _id
*         description: _id of user 
*         in: query
*         required: true
*     responses:
*       200:
*         description: Returns success message
*/
    async deleteUser(req, res, next) {
        try {
            const { _id } = req.query;
            let user;
            user = await findUser(
                { _id: _id });
            if (!user) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            };
            await deleteUser(
                { _id: user._id });
            deleteOutfitFunc(user._id);
            return res.json(new response({}, responseMessage.DELETE_SUCCESS));

        } catch (error) {
            return next(error)
        }
    };


}
export default new adminController()



async function deleteOutfitFunc(id) {
    try {
        let find = await outfit.find({ userId: id });
        if (find.length !== 0) {
            for (let o of find) {
                await wardrobe.deleteOne({ outfitId: o._id })
            };
            await outfit.deleteMany({ userId: id })
        };
    } catch (error) {
        console.log(error)
    }
}




















































