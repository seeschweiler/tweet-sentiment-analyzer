import express from "express";
import fetch from "node-fetch";
import cors from "cors";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: "INSERT YOUR OPENAI API KEY HERE",
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const BRIGHTDATA_API_KEY = "INSERT YOUR BRIGHT DATA API KEY HERE";

app.post("/api/analyze", async (req, res) => {
  try {
    const { hashtag } = req.body;
    const bodyData = JSON.stringify([{ "Hashtag - #": hashtag, max_posts: 5 }]);
    const response = await fetch(
      "https://api.brightdata.com/dca/trigger?collector=c_lgc4f8252fnn4lsf4q&queue_next=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: bodyData,
      }
    );

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(`Error: ${response.status} - ${response.statusText}`);
      console.error(`Response body: ${responseBody}`);
      throw new Error("An error occurred while processing the request.");
    }

    const { collection_id } = await response.json();
    res.json({ collection_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

app.get("/api/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`https://api.brightdata.com/dca/dataset?id=${id}`);
    const response = await fetch(
      `https://api.brightdata.com/dca/dataset?id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Error:", response.status, "-", response.statusText);
      const responseBody = await response.text();
      console.error("Response body:", responseBody);
      throw new Error("An error occurred while processing the request.");
    }

    const data = await response.json();

    if (data.status) {
      res.status(202).json({
        status: data.status,
        message: "Job is still running. Please try again later.",
      });
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

app.post("/api/analyze-sentiment", async (req, res) => {
  try {
    const { tweets } = req.body;

    const messages = [
      {
        role: "system",
        content:
          "You are a tweet sentiment analyst. You're analyzing tweets for their sentiment and provide a rating. 0 is absolute negative and 10 is absolute positive. If you're provided with a list of tweets you can calculate the one average rating over all tweets. You can also output a text description interpreting this number.",
      },
      {
        role: "user",
        content: `Classify the sentiment in these tweets: ${JSON.stringify(
          tweets
        )}`,
      },
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
    });

    const sentimentAnalysisResult = completion.data.choices[0].message.content;

    res.json({ sentimentAnalysisResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
