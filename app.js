const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.listen(process.env.PORT);

const authRouter = require("./routes/auth");

app.use("/users", authRouter);
