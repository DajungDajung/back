const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connection = require('./mariadb');
dotenv.config();

app.use(express.json())

app.listen(process.env.PORT);

const MyPageRouter = require('./routes/myPage');

app.use("/users", MyPageRouter);
