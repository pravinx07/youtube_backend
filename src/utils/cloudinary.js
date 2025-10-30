import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadCloudinary = async (localfilePath) => {
        try {
            if(!localfilePath) return null;
            // upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localfilePath,{
                resource_type:"auto"
            })

            // file has been uploaded successfully
            // console.log("file is uploaded on cloudinary", response.url);
            fs.unlinkSync(localfilePath)
            console.log("response from clodinary file ",response);
            
            return response

            
        } catch (error) {
            fs.unlinkSync(localfilePath) // remove the locally saved temp file as the upload operation got failed
            return null
        }
    }

// cloudinary.uploader.upload()
export {uploadCloudinary}