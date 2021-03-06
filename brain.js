let utils = require('./utils.js');

const redis = require('redis');
const sub = redis.createClient(6379, 'beat42');
const pub = redis.createClient(6379, 'beat42'); //need 2 clients: can't publish after subscribed

const REGISTRY_KEY = 911;
let sig_key = 'aggiotmo';
let bidsHash = undefined;
let balance = undefined;

sub.subscribe("exchange.market", (arg, channel) => console.log(`Subscribed to ${channel}.`));
// subscribe to groot specific logs
sub.subscribe("exchange.logs.groot", (arg, channel) => console.log(`Subscribed to ${channel}`));
sub.subscribe(`exchange.registry.${REGISTRY_KEY}`);
sub.subscribe('exchange.balances.groot');
sub.subscribe("exchange.bids");
sub.subscribe("exchange.balances.groot");

sub.on("message", (topic, msg) => {
  console.log("\x1b[33m", topic + ' ==========================');
  if (topic === "exchange.market") {
    let market = JSON.parse(msg);
    console.log("\x1b[0m", market);

    if (bidsHash) {
      bidsHash[market.offerId] = {
        qty: market.units,
        offerId: market.offerId,
        price: market.price
      };
    }
  }
  else if (topic === "exchange.logs.groot") {
    console.log("\x1b[0m", msg);
  }
  else if (topic === "exchange.balances.groot") {
    let response = JSON.parse(msg);
    balance = response.balance;
    let update = {
      component: "groot",
      data: {path: 'message', value: `Net worth: $${(balance).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`}
    };
    pub.publish("main.model", JSON.stringify(update));

    console.log('STARTING BID CYCLE');
    console.log("\x1b[0m", msg);
    startBidCycle();
  }
  else if (topic === `exchange.registry.${REGISTRY_KEY}`) {
    let response = JSON.parse(msg);
    if (!sig_key) {
      sig_key = response.key;
      console.log("\x1b[0m", 'sig key set: ', sig_key);
    }
  }
  else if (topic === 'exchange.bids') {
    let bid = JSON.parse(msg);
    console.log(bid);
    if (bidsHash) {
      if (!bidsHash[bid.offerId] || (bidsHash[bid.offerId] && bidsHash[bid.offerId].price <= bid.price)) {
        bidsHash[bid.offerId] = parseBid(bid);
      }
    }
  }
  else {
    console.log("\x1b[0m", msg);
  }
});

const register = () => {
  pub.publish('exchange.registry', JSON.stringify( {slot:'groot', name:'Groot Marijuana Blockchain Inc.', reqId: REGISTRY_KEY }));
}

startBidCycle = () => {
  bidsHash = {};
  setTimeout(() => {
    console.log('Ending bid cycle:', Object.keys(bidsHash));
    publishBids(bidsHash);
    bidsHash = {};
  }, 9000)
}

publishBids = (hash) => {
  if (!sig_key) {
    console.log("Can't bid yet, haven't received a key");
    return;
  }

  Object.keys(hash).forEach((key) => {
    let quantity;
    console.log('balance vs price for qty:', balance, (hash[key].qty * hash[key].price));
    if (balance > (hash[key].qty * hash[key].price)) {
      quantity = hash[key].qty;
    } else {
      quantity = parseInt((balance/5) / (hash[key].price + 1)) || hash[key].qty / 2;
    }
    pub.publish('exchange.bids', JSON.stringify({
      offerId: hash[key].offerId,
      slot: 'groot',
      qty: quantity,
      price: hash[key].price + 1,
      signed: utils.getSignature(sig_key, hash[key].offerId)
    }));
  });

}

parseBid = (bid) => {
  return {
    offerId: bid.offerId,
    qty: bid.qty,
    price: bid.price
  };
}
if (!sig_key) {
  register();
}
