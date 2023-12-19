const express = require('express');
const nodemailer = require('nodemailer');
const Usercontrollers = require('./controller')
const verifyToken = require('./middleware/token')

const app = express();
app.use(express.json());

// GET ALL USERS
app.get('/users', Usercontrollers.getAllUsers);

//GET USERNAME BY ID
app.get('/users/:id', verifyToken, Usercontrollers.getUserById)

//REGISTER USER
app.post('/users', Usercontrollers.registerUsers);

//LOGIN USER
app.post('/users/login', Usercontrollers.loginUsers);

//DELETE USER
app.delete('/users/:userId', verifyToken, Usercontrollers.deleteUsers);

//FORGOT PASSWORD
app.post('/users/forgot-password', Usercontrollers.forgotPasswordUsers);

//RESET PASSWORD
app.post('/users/reset-password/:reset_token', Usercontrollers.resetPasswordUsers);

//UPDATE USER
app.put('/users/edit/:userId', verifyToken, Usercontrollers.updateUser);

//GET DESCRIPTION
app.get('/buah/:kelas', verifyToken, Usercontrollers.getDescription)


app.listen(3000, () => {
    console.log('Server started on port 3000');
});