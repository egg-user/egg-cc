const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const UsersModel = require('./models')
const db = require('./database')
dotenv.config();




const getAllUsers = (req, res) => {
    db.query('SELECT * FROM akun', (error, result) => {
        if (error) {
            res.status(500).json({
                message: 'Server error',
                serverMessage: error
            })
        } else {
            res.json({
                message: 'GET Success',
                result
            });
        }
    });
}

const getUserById = (req, res) => {
    const userId = req.params.id;  
    const query = 'SELECT first_name, last_name FROM akun WHERE id = ?';

    db.query(query, [userId], (error, result) => {
        if (error) {
            res.status(500).json({
                message: 'Server error',
                serverMessage: error
            });
        } else {
            if (result.length > 0) {
                res.json({
                    message: 'GET User by ID Success',
                    user: result[0]  // Mengambil pengguna pertama dari hasil query
                });
            } else {
                res.status(404).json({
                    message: 'User not found'
                });
            }
        }
    });
};

const registerUsers = async (req, res) => {
    const email = req.body.email;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const password = req.body.password;

    if(!first_name || !last_name || !email.includes('@gmail.com') || !password) {
        return res.json({
            message: 'masukan data dengan benar'
        })
    }
    
    try {
        const existingUser = await UsersModel.getUserByEmail(req.body.email);

        if (existingUser) {
            res.status(400).json({
                message: 'Email is already registered',
            });
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const newUser = {
                first_name : req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                password: hashedPassword,
                
            };

            db.query('INSERT INTO akun SET ?', newUser, (error, result) => {
                if (error) {
                    res.status(500).json({
                        message: 'Internal Server Error',
                        serverMessage: error,
                    })
                } else {
                    res.status(201).json({
                        message: 'User Registered',
                        serverMessage: result,
                    })
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            serverMessage: error,
        })
    }
}



const loginUsers = async (req, res) => {
    const email = req.body.email;
    db.query('SELECT * FROM akun WHERE email = ?', email, async (error, results) => {
        if (error) {
            res.status(500).json({
                message: 'Internal Server Error',
                serverMessage: error
            });
        } else if (results.length > 0) {
            const user = results[0];
            try {
                if (await bcrypt.compare(req.body.password, user.password)) {
                    const token = UsersModel.generateToken(user.id);
                    res.json({
                        message: 'Login berhasil',
                        token: token,
                    });
                } else {
                    res.json({
                        message: 'gagal'
                    });
                }
            } catch (error) {
                console.log(error);
                res.status(500).json({
                    message: 'Internal Server Error'
                })
            }
        } else {
            res.status(400).json({
                message: 'User not found'
            });
        }
    });
}

const deleteUsers = (req, res) => {
    const userId = req.params.userId;

    db.query('DELETE FROM akun WHERE id = ?', userId, (error, result) => {
        if (error) {
            res.status(500).json({
                message: 'Internal Server Error',
                serverMessage: error,
            })
        } else if (result.affectedRows > 0) {
            res.json({
                message: `User with ID ${userId} deleted successfully`
            })
        } else {
            res.status(404).json({
                message: `User with ID ${userId} not found`
            });
        }
    });
}

const forgotPasswordUsers = async (req, res) => {
    const email = req.body.email;

    try {
        const user = await UsersModel.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        // Gtoken digenerate
        const token = crypto.randomBytes(20).toString('hex');

        // update token ke database
        db.query('UPDATE akun SET reset_token = ? WHERE id = ?', [token, user.id], (error, result) => {
            if (error) {
                return res.status(500).json({
                    message: 'Internal Server Error',
                    serverMessage: error,
                })
            }

            // sending lokal dengan token
            console.log('Reset Token:', token);
            res.status(200).json({
                message: 'Reset password berhasil',
                token: token 
            });
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            serverMessage: error,
        })
    }
}

const resetPasswordUsers = async (req, res) => {
    const reset_token = req.params.reset_token;
    const newPassword = req.body.newPassword;

    try {
        const user = await UsersModel.getUserByResetToken(reset_token);

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired token'
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        db.query('UPDATE akun SET password = ?, reset_token = NULL WHERE id = ?', [hashedPassword, user.id], (error, result) => {
            if (error) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    serverMessage: error,
                });
            } else {
                res.json({
                    message: 'Password reset successfully'
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            serverMessage: error,
        });
    }
}



const updateUser = async (req, res) => {
    const userId = req.params.userId;
    const newFirstName = req.body.new_first_name;
    const newLastName = req.body.new_last_name;
    const newPassword = req.body.new_password;
    const newEmail = req.body.new_email;

    if (!newFirstName && !newLastName && !newPassword && !newEmail) {
        return res.status(400).json({
            message: 'Silahkan isi bagian yang kosong'
        });
    }

    const updateFields = {};
    if (newFirstName) {
        updateFields.first_name = newFirstName;
    }
    if (newLastName) {
        updateFields.last_name = newLastName;
    }
    if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.new_password, salt);
        updateFields.password = hashedPassword;
    }
    if (newEmail) {
        const existingUser = await UsersModel.getUserByEmail(newEmail);
        if (existingUser) {
            res.status(400).json({
                message: 'Email is already registered'
            });
            return;
        } else {
            updateFields.email = newEmail;
        }
    }

    db.query('UPDATE akun SET ? WHERE id = ?', [updateFields, userId], (error, result) => {
        if (error) {
            res.status(500).json({
                message: 'Internal Server Error',
                serverMessage: error,
            });
        } else {
            if (result.affectedRows > 0) {
                res.json({
                    message: 'User updated successfully',
                });
            } else {
                res.status(404).json({
                    message: 'User not found',
                });
            }
        }
    });
}

const getDescription = (req, res) => {
    const kondisi = req.params.kelas;
    const sql = 'SELECT deskripsi, rekomendasi FROM buah WHERE kondisi = ?';

    db.query(sql, [kondisi], (err, result) => {
      if (err) {
        console.error('Gagal mengambil data: ' + err.message);
        res.status(500).json({ error: err.message });
        return;
      }

      if (result.length > 0) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Data tidak ditemukan' });
      }
    });
};


module.exports = {
    getAllUsers,
    registerUsers,
    loginUsers,
    deleteUsers,
    forgotPasswordUsers,
    resetPasswordUsers,
    updateUser,
    getUserById,
    getDescription
}