const db = require('./database');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const MY_KEY = process.env.MY_KEY;

const getUserByEmail = async function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM akun WHERE email = ?', email, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0]);
            }
        });
    });
} 

const getUserByResetToken = async function getUserByResetToken(token) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM akun WHERE reset_token = ?', token, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0]);
            }
        });
    });
}

const getUserById = async function getUserById(userId) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE id = ?', userId, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0]);
            }
        });
    });
}

const generateToken = function generateToken(userId) {
    return jwt.sign({ userId }, MY_KEY, { expiresIn: '1h' });
}

module.exports = {
    getUserByEmail,
    getUserByResetToken,
    getUserById,
    generateToken
}