const express = require('express');

const Task = require('../model/task');

const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (request, response) => {
    const task = new Task.Task({
        //ES6 syntax to copy data from another object
        ...request.body,
        owner: request.user._id
    });
    try{
        const result = await task.save();
        return response.status(201).send(result);
    }catch(e){
        if(e.name && e.name === 'ValidationError'){
            return response.status(400).send(e);
        }
        response.status(500).send(e);
    }
});


// Fetching tasks for authicated user
// /tasks?completed=true || /tasks?completed=false
// /tasks?limit=10&skip=10
// /tasks?sortBy=createdAt:asc
router.get('/tasks', auth, async (req, res) => {
    try {
        //Mongo object to filter data
        const match = {};

        const sort = {};

        if(req.query.completed){
            match.completed = req.query.completed === 'true';
        }

        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 0;
        }
        //Using the virtual field on userSchema to fetch the tasks
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        const result = req.user.tasks;
        if(!result){
            return res.status(404).send();
        }
        res.send(result);
    }catch(e){
        res.status(500).send(e);
    }
});


// Fetch task by Id for the authenticated user
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try{
        const result = await Task.Task.findOne({_id, owner: req.user._id});
        if(!result){
            return res.status(404).send();
        }
        res.send(result);
    }catch(e){
        res.status(500).send(e);
    }
});


router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => Task.allowedUpdates.includes(update));

    if(!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates!', allowedUpdates: Task.allowedUpdates})
    }

    try{
        const result = await Task.findOne({_id, owner: req.user._id});
        if(!result){
            return res.status(404).send();
        }
        updates.forEach(update => result[update] = req.body[update]);    
        res.send(result);
    }catch(e){
        if(e.name && e.name === 'ValidationError'){
            return response.status(400).send(e);
        }
        response.status(500).send(e);
    }
});


router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try{
        const result = await Task.Task.findOneAndDelete({_id, owner: req.user._id});
        if(!result){
            return res.status(404).send();
        }
        res.send(result);
    }catch(e){
        res.status(500).send(e);
    }
});

module.exports = router;