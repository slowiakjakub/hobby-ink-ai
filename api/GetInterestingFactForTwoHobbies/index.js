const OpenAI = require('openai');
module.exports = async function (context, req) {

    const openai = new OpenAI({
        apiKey: 'OpenAI-APIKEY',
      });

    const gptPrompt = `Give a quick interesting fact combining interests in ${req.body.hobby1} and ${req.body.hobby2}. Response should be max one sentence. Give only the response.`;
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: "user", content: gptPrompt }],
        model: "gpt-4",
    });
    let chatResponse = chatCompletion.choices[0].message.content;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: chatResponse
    };
}