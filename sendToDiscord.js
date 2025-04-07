const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');

// Load the JSON data from the file
const playersFilePath = path.join(__dirname, 'cron/data', 'players-new.json');
const webhookUrl = 'https://discord.com/api/webhooks/1295998895406448703/BKjSIFn7W5V2aGdTlLEuK6vmi1iLllHSLAfjvv0KA1-lHQC5OTkssWWVk2aQIRlDcmpA'; // Replace with your actual Discord webhook URL

// Function to send data to Discord webhook
function sendToDiscord() {
  // Read the JSON file
  fs.readFile(playersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    const playersData = JSON.parse(data);

    // Prepare the message content with displayName, connectCode, ratingOrdinal, wins, and losses
    const messageContent = playersData.map(player => {
      const { displayName, connectCode, rankedNetplayProfile } = player;
      return `**${displayName}** (${connectCode.code})\nRating: ${rankedNetplayProfile.ratingOrdinal}\nWins: ${rankedNetplayProfile.wins}, Losses: ${rankedNetplayProfile.losses}`;
    }).join('\n\n'); // Separate each player with a double new line for better readability

    
    const message = JSON.stringify({
      content: '**Player Rankings:**\n' + messageContent
    });

    // Parse the webhook URL
    const webhookUrlObj = new url.URL(webhookUrl);

    // Set up the HTTP request options
    const options = {
      hostname: webhookUrlObj.hostname,
      path: webhookUrlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': message.length
      }
    };

    // Create the request
    const req = https.request(options, (res) => {
      let responseData = '';
      // Collect response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      

      // Handle end of the response
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log('Message sent successfully!');
        } else {
          console.error('Error sending message:', res.statusCode, responseData);
        }
      });
    });

    // Handle request errors
    req.on('error', (error) => {
      console.error('Request error:', error);
    });

    // Write the message data and end the request
    req.write(message);
    req.end();
  });
}

// Call the function to send the data
sendToDiscord();
