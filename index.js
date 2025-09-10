
require('dotenv').config()

const express = require('express')
const app = express()
const port = 4000
app.get('/',(req,res)=>{
    res.send('HELLo World')
})

app.get('/Twitter',(req,res)=>{
    res.send('HELLo Sami')
})

app.get('/login',(req,res)=>{
    res.send('<h1>your DaDy</h1>')
})



app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port${port}`)

})







