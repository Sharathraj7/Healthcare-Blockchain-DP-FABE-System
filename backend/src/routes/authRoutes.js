/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Patient registration validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('age').isInt({ min: 1, max: 150 }).withMessage('Valid age required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('height').isFloat({ min: 50, max: 300 }).withMessage('Valid height in cm required'),
  body('weight').isFloat({ min: 1, max: 500 }).withMessage('Valid weight in kg required'),
];

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/patient/register', registerValidation, authController.registerPatient);
router.post('/patient/login', loginValidation, authController.loginPatient);
router.post('/doctor/login', loginValidation, authController.loginDoctor);

module.exports = router;
