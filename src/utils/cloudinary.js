import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: CLOUDINARY_API_SECRETE // Click 'View API Keys' above to copy your API secret
    });

    const uploadCloudinary = async (localfilePath) => {
        try {
            if(!localfilePath) return null;
            // upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localfilePath,{
                resource_type:"auto"
            })

            // file has been uploaded successfully
            console.log("file is uploaded on cloudinary", response.url);
            return response
            
        } catch (error) {
            fs.unlinkSync(localfilePath) // remove the locally saved temp file as the upload operation got failed
            return null
        }
    }

// cloudinary.uploader.upload()
export {uploadCloudinary}