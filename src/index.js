const express = require('express');
require('./db/mongoose');

const app = express();

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');


// This is express middleware registered to intercept all requests before they are sent to their handlers
// app.use((req, res, next) => {
//     res.status(503).send("Site is temporarily under maintenance, please check back soon!");
// });

// This is middleware registered to convert all http request body to json object
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

const port = process.env.PORT;

app.listen(port, () => {
    console.log('Server is now listening on port '+port);
});