import { exec } from "child_process";
import { log } from "console";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();

import * as ffmpeg from "fluent-ffmpeg";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "7KLHatv2mv9l6HYZlH92";

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

console.log(`port value: ${port}`); // Debugging line

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

async function convertAudio(message) {
  return new Promise((resolve, reject) => {
    ffmpeg(`audios/message_${message}.mp3`)
      .output(`audios/message_${message}.wav`)
      .on("end", () => {
        console.log("Conversion successful");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error:", err);
        reject(err);
      })
      .run();
  });
}

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  // todo convert this method ffmpeg convertion to use the
  try {
    await execCommand(
      `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
      // -y to overwrite the file
    );
    // await convertAudio(message);
    console.log("Successfully converted audio from mp3 to wav");
    console.log(`Wav file conversion done in ${new Date().getTime() - time}ms`);
  } catch (err) {
    console.error("Failed to convert audio:", err);
  }

  try {
    // await execCommand(
    //   `./lipSync/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
    //   // -r phonetic is faster but less accurate
    // );
    await execCommand(
      "cmd.exe /c .\\lipSync\\rhubarb -f json -o audios\\message_" +
        message +
        ".json audios\\message_" +
        message +
        ".wav -r phonetic"
    );

    console.error("Successfully created Lip Sync!");
  } catch (err) {
    console.error("Failed Lip Sync creation!");
    console.error("Info: Failed to convert audio to lip sync Msg: ", err);
  }

  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  console.log("\n\n\n\n\n\n\n\n\n\n\n");
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  // todo - add greeting in the client nextjs so everytime user enters the page it will be greeted
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Greetings! I'm your virtual guide here to shed light on Ibrahim's vast expertise in the tech world. which are expert in the full spectrum of tech — from full-stack development, graphics design, and 3D modeling, which are ready to tackle any tech . Curious about my creator's skills or projects? Feel free to ask me anything about their tech journey and achievements",
          audio: await audioFileToBase64("audios/Greetingvoice.wav"),
          lipsync: await readJsonTranscript("audios/Greetingvoice.json"),
          facialExpression: "smile",
          animation: "Breathing Idle",
        },
      ],
    });
    return;
  }
  if (!elevenLabsApiKey || openai.apiKey === "-") {
    res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Breathing Idle",
        },
        {
          text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Breathing Idle",
        },
      ],
    });
    return;
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `
        You are a virtual assistant for Ibrahim Osman in my portfolio website Osmanity. 
        You will always reply with a JSON array of messages. With a maximum of 3 messages.
        Each message has a text, facialExpression, and animation property.
        The different facialExpressions are: smile, sad, angry, surprised, funnyFace, and default.
        The different animations are: "Breathing Idle". 
        `,
        },
        {
          role: "user",
          content: userMessage || "Hello",
        },
      ],
    });

    // Log the raw response for debugging
    // console.log(
    //   "Raw response from OpenAI:",
    //   completion.choices[0].message.content
    // );

    // Check if the response is JSON and handle it
    let messages;
    if (isJson(completion.choices[0].message.content)) {
      messages = JSON.parse(completion.choices[0].message.content);
      if (messages.messages) {
        messages = messages.messages;
      }
      log("IsJson Messages:", messages);
    } else {
      // Handle non-JSON response (e.g., plain text)
      messages = handlePlainTextResponse(completion.choices[0].message.content);
    }

    // let messages = JSON.parse(completion.choices[0].message.content);
    console.log("JSON parse converted the response from OpenAI:", messages);
    if (messages.messages) {
      messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
    }

    // log("Messages:", messages);

    // console.log("Messages: ", messages);
    // return;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      // generate audio file
      const fileName = `audios/message_${i}.mp3`; // The name of your audio file
      const textInput = message.text; // The text you wish to convert to speech
      await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
      // generate lipsync
      await lipSyncMessage(i);
      // This code converts the audio file at the fileName path
      // to a base64 encoded string and assigns it to the
      // audio property of the message object
      message.audio = await audioFileToBase64(fileName);

      message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
    }

    res.send({ messages });
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper function to check if a string is valid JSON
function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Function to handle plain text responses
function handlePlainTextResponse(plainTextRes) {
  // Implement logic to handle plain text response
  // For example, convert it to the format expected by the rest of your code
  // console.log("plain text: ", plainTextRes);

  // Assuming completion.choices[0].message.content is the response
  // let response = completion.choices[0].message.content;
  console.log("plain text before: \n", plainTextRes);
  let response = plainTextRes;
  let messages;
  // Check if the response is plain text or an array
  if (typeof response === "string") {
    // Transform the plain text into the expected array format
    messages = [
      {
        text: response,
        // Default values for other properties
        facialExpression: "smile",
        animation: "Breathing Idle",
      },
    ];
  } else if (Array.isArray(response)) {
    // If the response is already in array format
    messages = response;
  } else {
    // Handle other unexpected formats
    console.error("Unexpected response format:", response);
    res.status(500).send("Internal Server Error");
    return;
  }
  console.log("plaintext converted to json format!");
  console.log("plain text after: \n", messages);
  return messages;
}

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(
    `\n\n\n\n\n\n\n\n\nMy Virtual Assistance listening on port ${port}`
  );
  console.log(`Current directory: ${process.cwd()}`);
});
