let utils = require('./utils.js');

const redis = require('redis');
const sub = redis.createClient(6379, 'beat42');
const pub = redis.createClient(6379, 'beat42'); //need 2 clients: can't publish after subscribed

const REGISTRY_KEY = 911;
let sig_key = undefined;

sub.subscribe("exchange.market", (arg, channel) => console.log(`Subscribed to ${channel}.`));
// subscribe to groot specific logs
sub.subscribe("exchange.logs.groot", (arg, channel) => console.log(`Subscribed to ${channel}`));
sub.subscribe(`exchange.registry.${REGISTRY_KEY}`);
sub.subscribe("exchange.bids");

sub.on("message", (topic, msg) => {
  console.log("\x1b[33m", topic + ' ==========================');
  if (topic === "exchange.market") {
    let market = JSON.parse(msg);
    console.log("\x1b[0m", market);
    let update = {
        component: "groot",
        data: {path: 'message', value: `Units available: ${market.units} at \$${market.price}.`}
    };
    pub.publish("main.model", JSON.stringify(update));

    handleMarketMessage(market);
  }
  else if (topic === "exchange.logs.groot") {
    console.log("\x1b[0m", msg);
  }
  else if (topic === `exchange.registry.${REGISTRY_KEY}`) {
    let response = JSON.parse(msg);
    sig_key = response.key;
    console.log("\x1b[0m", 'sig key set: ', sig_key);
  }
  else {
    console.log("\x1b[0m", msg);
  }
});

const register = () => {
  pub.publish('exchange.registry', JSON.stringify( {slot:'groot', name:'Groot Marijuana Blockchain Inc.', reqId: REGISTRY_KEY }));
}


handleMarketMessage = (market) => {
  if (!sig_key) {
    console.log("Can't bid yet, haven't received a key");
    return;
  }

  pub.publish('exchange.bids', JSON.stringify({
    offerId: market.offerId,
    slot: 'groot',
    qty: 1,
    price: market.price + 1,
    signed: utils.getSignature(sig_key, market.offerId)
  }));
}
register();
