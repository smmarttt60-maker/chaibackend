import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectdb = async() =>{
    try {
        const ConnectionINST = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`/n MONGODB CONNECTED !! DB HOST:${ ConnectionINST.connection.host}`);
        
        
    } catch (error) {
        console.log("ERROR:",error);
        process.exit(1)
        
    }
}
 export default connectdb