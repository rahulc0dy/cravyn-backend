import { Router } from "express";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  refreshAccessToken,
  deleteCustomerAccount,
  updateCustomerAccount,
  updateCustomerImage,
  getCustomerAccount,
  getCustomerAddresses,
  addCustomerAddress,
  deleteCustomerAddress,
  setCustomerDefaultAddress,
  placeOrder,
  getCustomerOrderHistory,
  cancelOrder,
} from "../../controllers/v1/customer.controller.js";
import { verifyUserJwt } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/common/multer.middleware.js";
import {
  getCustomerQueryByCustomerId,
  raiseCustomerQuery,
} from "../../controllers/v1/supportSystem.controller.js";
import {
  addItemToCart,
  decrementItemCount,
  getCart,
  incrementItemCount,
  removeItemFromCart,
} from "../../controllers/v1/cart.controller.js";

const router = Router();

router.route("/login").post(loginCustomer);
router.route("/register").post(registerCustomer);
router.route("/logout").post(verifyUserJwt, logoutCustomer);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/query")
  .post(verifyUserJwt, raiseCustomerQuery)
  .get(verifyUserJwt, getCustomerQueryByCustomerId);

router
  .route("/")
  .delete(verifyUserJwt, deleteCustomerAccount)
  .patch(verifyUserJwt, updateCustomerAccount)
  .get(verifyUserJwt, getCustomerAccount);
router
  .route("/profile-image")
  .patch(verifyUserJwt, upload.single("image"), updateCustomerImage);

router.route("/cart").get(verifyUserJwt, getCart);
router
  .route("/cart/item")
  .post(verifyUserJwt, addItemToCart)
  .delete(verifyUserJwt, removeItemFromCart);
router.route("/cart/item/plus").patch(verifyUserJwt, incrementItemCount);
router.route("/cart/item/minus").patch(verifyUserJwt, decrementItemCount);

router
  .route("/address")
  .get(verifyUserJwt, getCustomerAddresses)
  .post(verifyUserJwt, addCustomerAddress)
  .delete(verifyUserJwt, deleteCustomerAddress)
  .patch(verifyUserJwt, setCustomerDefaultAddress);

router.route("/place-order").post(verifyUserJwt, placeOrder);
router.route("/order-history").get(verifyUserJwt, getCustomerOrderHistory);
router.route("/cancel-order").post(verifyUserJwt, cancelOrder);

export default router;
