import dotenv from "dotenv"


import connectdb from "./db/index.js";

dotenv.config ({path: './env'})

connectdb()
.then(()=>{

app.on("ERRORR",(error)=>{
        console.log("ERROR:",error);
        throw error
       })
    app.listen(process.env.PORT || 8000,() =>{
console.log(` server is listening on port:${process.env.PORT}`);

    })
})

.catch((error)=>{
console.log("MONGO db connection failed",error);

})












// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// // import express from "express"
// const app = express()


// (async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("ERRORR",(error)=>{
//         console.log("ERROR:",error);
//         throw error
//        })
//        app.listen(process.env.PORT,()=>{
//         console.log(`app is listening on ${process.env.PORT}`);
    
//        })
       
        
//     } catch (error) {
//         console.error ("ERROR: ", error);
//         throw error
//     }
// })()