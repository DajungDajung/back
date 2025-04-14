const express =require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());

app.listen(process.env.PORT);

const itemRouter = require('./routes/items');

app.use('/items', itemRouter);

app.get('/',(req,res)=>{
    res.send('Hello World!');
})