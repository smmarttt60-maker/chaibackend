const asyncHandler = (fd)=>{

  return  (req,res,next)=>{
        Promise.resolve(fd(req,res,next)).catch((err)=>next(err))
    
    }
}
export{asyncHandler}
// const async = (fr)=>async(req,res,next)=>{
//     try {
//         await fr(req,res,next)
//     } catch (error) {
//         res.status(err.code ||500).json({
//             success:false,
//             Message:err.Message
//         })
        
//     }
// } 