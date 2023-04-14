const form = document.getElementById("hashtag-form");
const statusElement = document.getElementById("status");
const tweetsElement = document.getElementById("tweets");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const hashtag = document.getElementById("hashtag").value;
  if (!hashtag) return;
  statusElement.textContent = "Retrieving tweets...";
  tweetsElement.innerHTML = "";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtag }),
    });

    if (!response.ok) {
      throw new Error("An error occurred while processing the request.");
    }

    const jsonResponse = await response.json();
    console.log(jsonResponse); // Logs the entire jsonResponse object

    const { collection_id } = jsonResponse;
    console.log(collection_id);

    statusElement.textContent = "Analyzing tweets...";

    const intervalId = setInterval(async () => {
      const response = await fetch(`/api/status/${collection_id}`);
      const data = await response.json();
      if (data.status) {
        statusElement.textContent = data.message;
      } else {
        console.log("Data after retrieval: " + data);
        clearInterval(intervalId);
        statusElement.textContent = "Tweets retrieved and analyzed:";
        const tweets = data.map((tweet) => tweet["post body"]);

        const resultContainer = document.createElement("div");
        resultContainer.style.backgroundColor = "lightblue";
        resultContainer.style.padding = "1em";
        resultContainer.style.marginTop = "1em";
        resultContainer.style.borderRadius = "4px";

        fetch("/api/analyze-sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tweets }),
        })
          .then((response) => response.json())
          .then(({ sentimentAnalysisResult }) => {
            statusElement.textContent = "Sentiment analysis result:";
            const resultElement = document.createElement("p");
            resultElement.textContent = sentimentAnalysisResult;
            resultContainer.appendChild(resultElement);

            tweets.forEach((tweet) => {
              const li = document.createElement("li");
              li.textContent = tweet;
              tweetsElement.appendChild(li);
            });

            // Add the result container after the tweetsElement
            tweetsElement.insertAdjacentElement("afterend", resultContainer);
          })
          .catch((error) => {
            console.error(error);
            statusElement.textContent = "An error occurred. Please try again.";
          });
      }
    }, 50000);
  } catch (error) {
    statusElement.textContent = "An error occurred. Please try again.";
  }
});
