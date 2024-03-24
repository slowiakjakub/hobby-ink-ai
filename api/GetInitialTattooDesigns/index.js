const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();
const OpenAI = require("openai");
const { generateNImages } = require("../stabilityAIHelper.js");

module.exports = async function (context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");

  const AZURE_STORAGE_CONNECTION_STRING =
    "AzureStorageApiKey";

  // Create the BlobServiceClient object with connection string
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  // Get a reference to a blob container
  const containerClient = blobServiceClient.getContainerClient("pictures");

  const tattooDescriptions = await getTattooDescriptions(req);
  const tattooEncouragements = await getTattooEncouragements(tattooDescriptions,req);

  let generatedDesignsBase64Strings = [];

  const promises = tattooDescriptions.map((description) =>
    generateNImages(1, description)
  );

  const generatedDesignsArrays = await Promise.all(promises);

  generatedDesignsBase64Strings.push(...generatedDesignsArrays.flat());

  const imageDescriptors = [];
  for (let i = 0; i < generatedDesignsBase64Strings.length; i++) {
    imageDescriptors.push({
      id: uuidv1(),
      base64: generatedDesignsBase64Strings[i],
      description: tattooDescriptions[i],
      tattooEncouragement: tattooEncouragements[i],
    });
  }

  imageDescriptors.forEach((descriptor) => {
    uploadBlobUrl(containerClient, descriptor);
  });

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: {
      images: imageDescriptors,
    },
  };
};

const uploadBlobUrl = async (containerClient, descriptor) => {
  // Create a unique name for the blob
  const blobName = `testUser\\initial\\${descriptor.id}.png`;

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

const getTattooDescriptions = async (req) => {
  let gptPrompts = [];

  //creating prompts out of all 3 possible variations of hobbies
  gptPrompts.push(
    createGptPromptFromTwoHobbies(req, req.body.hobby1, req.body.hobby2)
  );
  gptPrompts.push(
    createGptPromptFromTwoHobbies(req, req.body.hobby1, req.body.hobby3)
  );
  gptPrompts.push(
    createGptPromptFromTwoHobbies(req, req.body.hobby2, req.body.hobby3)
  );

  const promises = gptPrompts.map((prompt) => getResponseFromChatGPT(prompt));

  const tattooDescriptionsUntrimmed = await Promise.all(promises);

  const tattooDescriptions = tattooDescriptionsUntrimmed.map((description) => description.slice(1,-1));

  return tattooDescriptions;
};

const createGptPromptFromTwoHobbies = (req, hobby1, hobby2) => {
  return `Create a one-sentence description of a tattoo design for a ${req.body.personality} ${req.body.gender} inspired by interests in "${hobby1}" and "${hobby2}" that would resonate with someone having these interests. Be short and concise and describe only key elements, without style. Response should contain exactly two general nouns and only one verb. For example: 'a cat holding a barbell', 'a computer in mountains'`;
};

const getResponseFromChatGPT = async (gptPrompt) => {
  const openai = new OpenAI({
    apiKey: "OpenAI-APIKEY",
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: gptPrompt }],
    model: "gpt-4",
    n: 1,
  });
  return chatCompletion.choices[0].message.content;
};

const getTattooEncouragements = async (tattooDescriptions,req) => {

  let gptPrompts = [];
  tattooDescriptions.forEach(description => {
    gptPrompts.push(
      `Please provide interesting one-sentenced casual encouraging explanation of why the idea of tattoo of a "${description}" would be a good idea to explore further for me, a ${req.body.personality} ${req.body.gender} with interests in ${req.body.hobby1}, ${req.body.hobby2} and ${req.body.hobby3}. Explanation should focus only hobbies related to description. Response should be lightweight and very subtle, short and in a conversational style and be directed to me that just have selected that idea. Add emoji mid-sentence, each one in different part of the sentence, and one at the end. Response should incorporate the description of the tattoo at the beginning.`
    );
  });

  const promises = gptPrompts.map((prompt) => getResponseFromChatGPT(prompt));

  const tattooEncouragements = await Promise.all(promises);

  return tattooEncouragements;
};
