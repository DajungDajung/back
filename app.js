const express =require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());

app.listen(process.env.PORT);

const itemRouter = require('./routes/items');
const likeRouter = require('./routes/likes');
const authRouter = require('./routes/auth');

app.use('/items', itemRouter);
app.use('/likes', likeRouter);
app.use('/users', authRouter);

app.get('/',(req,res)=>{
    res.send('Hello World!');
})