const express = require("express");
const router = express.Router()
const {auth , isInstructor, isStudent, isAdmin} = require("../middlewares/auth")
const {capturePayment, verifySignature, sendPaymentSuccessEmail} = require('../controllers/Payments')

router.post('./capturePayment', auth , isStudent, capturePayment);
router.post('/verifyPayment', auth , isStudent, verifySignature);
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);

module.exports = router