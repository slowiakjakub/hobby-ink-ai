const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();
const { generateNImageVariationsFromImageDescriptor } = require("../stabilityAIHelper.js");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let generatedDesigns = await generateNImageVariationsFromImageDescriptor(2, req.body.imageDescriptor);

    const imageDescriptors = [];
    imageDescriptors.push(req.body.imageDescriptor)

    for (let i = 0; i < generatedDesigns.length; i++) {
      imageDescriptors.push({
        id : uuidv1(),
        base64: generatedDesigns[i],
        description: req.body.imageDescriptor.description,
      });
    }
  
    //imageDescriptors.forEach((descriptor) => {
      //uploadBlobUrl(containerClient, descriptor);
    //});
  
    imageDescriptors.shift(); // delete first descriptor, as we already have it on frontend

    context.res = {
      // status: 200, /* Defaults to 200 */
      body: {
        images: imageDescriptors
      }
    };
};