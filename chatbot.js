const axios = require('axios');
require("dotenv").config();

async function callChatbotAPI(chat) {

    console.log('In ',chat);
  const data = JSON.stringify({
    "parameters":{
        "max_new_tokens": 100
    },
    "inputs": chat
  });
  console.log(data);
  const config = {
    method: 'post',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
    headers: { 
      'Authorization': 'Bearer '+ process.env.CHATBOT_ACCESS_KEY, 
      'Content-Type': 'application/json'
    },
    data : data
  };

  try {
    const response = await axios(config);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
}

module.exports = { callChatbotAPI };
