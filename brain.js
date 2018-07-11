
  const redis = require('redis');
  const sub = redis.createClient(6379, 'beat42');
  const pub = redis.createClient(6379, 'beat42'); //need 2 clients: can't publish after subscribed
  sub.subscribe("exchange.market", (arg, channel) => console.log(`Subscribed to ${channel}.`));
  sub.on("message", (topic, msg) => {
    let market = JSON.parse(msg);
    let update = {
       component: "groot",
       data: {path: 'message', value: `Units available: ${market.units} at \$${market.price}.`}
    };
    pub.publish("main.model", JSON.stringify(update));
  });