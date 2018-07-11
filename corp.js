const fs = require('fs');
const redis = require('redis');
const redisClient = redis.createClient(6379, 'beat42');
let ui = {
    component: "groot",
    files: [
      {
        name: 'module.js',
        content: fs.readFileSync("module.js","utf8")
      },
      {
        name: 'style.css',
        content: fs.readFileSync("styles.css","utf8")
      }
    ]
  };

redisClient.publish("main.ui", JSON.stringify(ui));
redisClient.quit();