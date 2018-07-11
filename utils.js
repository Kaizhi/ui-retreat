let crypto = require('crypto');

module.exports = {
  getSignature: (key, offerId = 1) => {
    let md5 = (str) => {
      let md5sum = crypto.createHash('md5');
      md5sum.update(str);
      return md5sum.digest('hex');
    };
    //offerId is sent with each market update. key comes from registration
    let signature = md5(offerId+":"+key);
    return signature;
  }
}