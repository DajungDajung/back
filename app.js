const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

app.listen(process.env.PORT);

const likeRouter = require('./routes/likes');

app.use("/likes", likeRouter);