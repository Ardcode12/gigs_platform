const express = require('express');
const router = express.Router();
const { societyLogin, workerLogin, customerRegister, customerLogin, logout } = require('../controllers/auth.controller');

// Society login
router.post('/society/login',     societyLogin);

// Worker login
router.post('/worker/login',      workerLogin);

// Customer register + login
router.post('/customer/register', customerRegister);
router.post('/customer/login',    customerLogin);

// Shared logout
router.post('/logout', logout);

module.exports = router;
