import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  .post("/login", controller.login)

  .use(auth.adminToken)
  .get("/profile", controller.profile)
  .put("/edit", controller.edit)
  .put("/changePass", controller.changePass)
  .post("/addCategory", controller.addCategory)
  .get("/viewCategory", controller.viewCategory)
  .put("/editCategory", controller.editCategory)
  .delete("/deleteCategory", controller.deleteCategory)
  .get("/categoryList", controller.categoryList)
  .get("/userList", controller.userList)
  .get("/brandList", controller.brandList)
  .get("/productList", controller.productList)
  .delete("/deleteProduct", controller.deleteProduct)
  .get("/dashboard", controller.dashboard)
  .get("/queryList", controller.queryList)
  .put("/closeQuery/:_id", controller.closeQuery)
  .post("/sendNotifications", controller.sendNotifications)
  .put("/enableDisabledUser", controller.enableDisabledUser)
  .delete("/deleteUser", controller.deleteUser)

