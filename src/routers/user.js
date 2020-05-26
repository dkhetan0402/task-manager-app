const express = require('express');

const User = require('../model/user');

const auth = require('../middleware/auth');

const multer = require('multer');

const account = require('../emails/account');

const upload = multer({
    // WHen dest is not provided, file data will be available in the routeHandler in the file attribute of req object
    // Not a good idea to save files to filesystem as each deployment to cloud infra will wipe out the filesystem and uploaded data will be lost
    //dest: 'avatars/',
    limits: 1000000,
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image document'), undefined)
        }

        return cb(undefined, true)
    }
})

const sharp = require('sharp');

const router = new express.Router();

router.post('/users',async (request, response) => {
    const user = new User.User(request.body);
    try{
        await user.save();
        account.sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        return response.status(201).send({user, token});
    }catch(e){
        if(e.name && e.name === 'ValidationError'){
            return response.status(400).send(e);
        }
        response.status(500).send(e);
    }
});

//Param1 = path, param2 = middleware function, param3 = route handler
router.get('/users/me', auth, async (req, res) => {
        res.send(req.user);
});

router.get('/users/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try{
        const result = await User.User.findById(_id);
        if(!result){
            return res.status(404).send();
        }
        res.send(result);
    }catch(e){
        res.status(500).send(e);
    }
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => User.allowedUpdates.includes(update));

    if(!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates!', allowedUpdates: User.allowedUpdates})
    }
    
    try{
        const user = req.user;
        updates.forEach(update => user[update] = req.body[update]);
        await user.save();
        res.send(user);
    }catch(e){
        if(e.name && e.name === 'ValidationError'){
            return res.status(400).send(e);
        }
        res.status(500).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove();
        account.sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    }catch(e){
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.User.findUserByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        return res.send({user, token});
    }catch(e){
        res.status(400).send(e);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
       
        await req.user.save();
    
        res.send();
    }catch(e){
        res.status(500).send();
    }
    
})

router.post('/users/logoutall', auth, async (req, res) => {
    try{
        req.user.tokens = [];
        await req.user.save();
    
        res.send();
    }catch(e){
        res.status(500).send();
    }
    
})

//route handler is called when all middleware executes successfully.
//Error handler(last argument of the router) will be called when the middleware fails and throws error without handling them
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try{
        const imgBuffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
        req.user.avatar = imgBuffer;
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send(e);
    }
    
}, async (error, req, res, next) => {
    res.status(400).send({error: error.message})
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    try{
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
    
})

router.get('/users/me/avatar', auth, async (req, res) => {
    try{
        res.set('Content-Type','image/png');
        res.send(req.user.avatar);
    }catch(e){
        res.status(500).send();
    }
    
})

module.exports = router;