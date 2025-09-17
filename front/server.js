import express from 'express';
const app = express();
app.get('/',(req,res)=>{
    res.send("HELLO server");
});
app.get('/api/jokes',(req,res)=>{
    
const jokes=[
    {
        id:1,
        title:'king is title',
        content:'THis is my table',
    },
     {
        id:2,
        title:'king is title',
        content:'THis is my table',
    },
     {
        id:3,
        title:'king is title',
        content:'THis is my table',
    },
]









res.send(jokes);
    

});







const port = process.env.PORT || 3000;

app.listen(port,()=>{
    console.log(`serve at http://localhost:${port}`);
    
});
