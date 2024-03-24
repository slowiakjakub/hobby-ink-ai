const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();
const { generateNImages } = require("../stabilityAIHelper.js");

module.exports = async function (context, req) {
  const AZURE_STORAGE_CONNECTION_STRING =
    "AzureStorageApiKey";

  // Create the BlobServiceClient object with connection string
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  // Get a reference to a blob container
  const containerClient = blobServiceClient.getContainerClient("pictures");

  let generatedDesigns = await generateNImages(2, req.body.imageDescriptor.description);

  const imageDescriptors = [];
  imageDescriptors.push(req.body.imageDescriptor)
  for (let i = 0; i < generatedDesigns.length; i++) {
    imageDescriptors.push({
      id : uuidv1(),
      base64: generatedDesigns[i],
      description: req.body.imageDescriptor.description,
    });
  }

  imageDescriptors.forEach((descriptor) => {
    uploadBlobUrl(containerClient, descriptor);
  });

  imageDescriptors.shift(); // delete first descriptor, as we already have it on frontend

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: {
      images: imageDescriptors,
    },
  };
};

const uploadBlobUrl = async (containerClient, descriptor) => {
  // Create a unique name for the blob
  const blobName = `testUser\\initial\\specificIdeaDesigns\\${descriptor.id}.png`;

  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const buffer = Buffer.from(descriptor.base64, "base64");

  // Upload buffer to Azure Blob Storage
  const uploadBlobResponse = await blockBlobClient.upload(
    buffer,
    buffer.length
  );

  return;
};
