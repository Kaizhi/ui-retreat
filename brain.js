let utils = require('./utils.js');

const redis = require('redis');
const sub = redis.createClient(6379, 'beat42');
const pub = redis.createClient(6379, 'beat42'); //need 2 clients: can't publish after subscribed
const REGISTRY_KEY = 911;

sub.subscribe("exchange.market", (arg, channel) => console.log(`Subscribed to ${channel}.`));
// subscribe to groot specific logs
sub.subscribe("exchange.logs.groot", (arg, channel) => console.log(`Subscribed to ${channel}`));
sub.subscribe(`exchange.registry.${REGISTRY_KEY}`);

sub.on("message", (topic, msg) => {
  console.log(topic);
  if (topic === "exchange.market") {
    let market = JSON.parse(msg);
    let update = {
        component: "groot",
        data: {path: 'message', value: `Units available: ${market.units} at \$${market.price}.`}
    };
    pub.publish("main.model", JSON.stringify(update));
  }
  else if (topic === "exchange.logs.groot") {
    console.log(msg);
  }
  else if (topic === `exchange.registry.${REGISTRY_KEY}`) {
    let response = JSON.parse(msg);
    console.log(utils.getSignature(msg.key));

  }
  else {
    console.log(topic + ':', msg);
  }
});

const register = () => {
  pub.publish('exchange.registry', JSON.stringify( {slot:'groot', name:'Groot Marijuana Blockchain Inc.', reqId: REGISTRY_KEY }));
}

register();


