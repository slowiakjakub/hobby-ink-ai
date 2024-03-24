const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function generateNImages(numberOfImagesToGenerate, description) {
  const path =
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
    //"https://api.stability.ai/v1/generation/stable-diffusion-512-v2-1/text-to-image";
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: "Bearer SD-APIKEY",
  };

  imageEnginePrompt = getPromptForImageEngine(description);

  const body = {
    steps: 40,
    width: 1024,
    height: 1024,
    seed: 0,
    cfg_scale: 8,
    samples: numberOfImagesToGenerate,
    text_prompts: [
      {
        text: imageEnginePrompt,
        weight: 1,
      },
      {
        text: "blurry, bad",
        weight: -1,
      },
    ],
  };
  const response = await fetch(path, {
    headers,
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Non-200 response: ${await response.text()}`);
  }

  const responseJSON = await response.json();

  const generatedDesigns = responseJSON.artifacts.map(
    (artifact) => artifact.base64
  );

  return generatedDesigns;
}

async function generateNImageVariationsFromImageDescriptor(
  numberOfVariationsToGenerate,
  imageDescriptor
) {
  const bufferFromImageDescriptor = Buffer.from(imageDescriptor.base64, 'base64');

  imageEnginePrompt = getPromptForImageEngine(imageDescriptor.description);

  let formData = new FormData();
  formData.append("init_image", bufferFromImageDescriptor);
  formData.append("init_image_mode", "IMAGE_STRENGTH");
  formData.append("image_strength", 0.35);
  formData.append("steps", "40");
  formData.append("text_prompts[0][text]", imageEnginePrompt);
  formData.append("text_prompts[0][weight]", 1);
  formData.append("text_prompts[1][text]", "blurry, bad");
  formData.append("text_prompts[1][weight]", -1);
  formData.append("cfg_scale", "5");
  formData.append("samples", numberOfVariationsToGenerate);

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
    //url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/image-to-image",
    headers: {
      Authorization:
        "Bearer SD-APIKEY",
      Accept: "application/json",
      ...formData.getHeaders(),
    },
    data: formData,
  };

  const response = await axios.request(config); // TODO: Implement catching errors - now if api throws e.g 400 we don't know details of message

  if (response.status !== 200) {
    throw new Error(`Non-200 response: ${await response.data}`);
  }

  const responseJSON = response.data;

  const generatedDesigns = responseJSON.artifacts.map(
    (artifact) => artifact.base64
  );

  return generatedDesigns;
}

const getPromptForImageEngine = (description) => {
  const descriptionPromptPart = description.endsWith(".")
    ? description.slice(0, -1)
    : description;
  const imageEnginePrompt = `ultra minimalistic tattoo of ${descriptionPromptPart}, tattoo outline, on skin`;
  return imageEnginePrompt;
};

module.exports = {
  generateNImages,
  generateNImageVariationsFromImageDescriptor,
};
