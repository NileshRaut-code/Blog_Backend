import multer from "multer";
//multer used to store file to the local storage /our server
const storage = multer.diskStorage({
  //cb- call back , 
    
    destination: function (req, file, cb) {
      
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      console.log(file);
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})