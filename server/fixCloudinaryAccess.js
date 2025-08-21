const cloudinary = require("cloudinary").v2;

// Configure your Cloudinary credentials
cloudinary.config({
  cloud_name: "djhr50wjh",
  api_key: "757333175981861",
  api_secret: "pcs4r1sqTjf0opUqIVLtIuayhM0",
});

// Function to update access for all PDFs in `pdf_uploads`
async function makePdfsPublic() {
  try {
    // Fetch all files in the folder `pdf_uploads`
    const resources = await cloudinary.api.resources({
      type: "upload",
      resource_type: "raw",
      prefix: "pdf_uploads/",
      max_results: 500, // adjust as needed
    });

    console.log(`Found ${resources.resources.length} PDFs.`);

    // Update each file's access_mode to 'public'
    for (const resource of resources.resources) {
      const publicId = resource.public_id;
      console.log(`Updating: ${publicId}`);
      await cloudinary.api.update(publicId, {
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
      });
    }

    console.log("✅ All PDFs set to public!");
  } catch (error) {
    console.error("❌ Error fixing PDF access:", error);
  }
}

makePdfsPublic();
