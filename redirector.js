'use strict';

var shortid = require('shortid');
var dynamodb = require('aws-sdk/clients/dynamodb');
var db = new dynamodb();

module.exports.redirector = async (event, context) => {
  var body = JSON.parse(event.body);
  var url = body.url;

  var key = await insertToTable(url);

  return {
    statusCode: 200,
    body: JSON.stringify({
      key: key
    }),
  };
};

module.exports.redirect = async (event, context) => {
  var key = event.pathParameters.key
  var url = await getUrlFromKey(key);

  return {
    statusCode: 301,
    headers: {
      Location: url
    }
  };
};

function insertToTable(url) {
  var uniqueKey = generateUniqueKey()

  var params = {
    Item: {
      "id": {
        S: uniqueKey
      },
      "url": {
        S: url
      },
    },
    TableName: process.env.TABLE_NAME
  };

  return new Promise((resolve, reject) => {
    db.putItem(params, function(error, data) {
      if (error) {
        console.log(error);
        reject(error);
      }

      resolve(uniqueKey);
    });
  });
}

function getUrlFromKey(key) {
  var params = {
    Key: {
      "id": {
        S: key
      }
    },
    TableName: process.env.TABLE_NAME
  };

  return new Promise((resolve, reject) => {
    return db.getItem(params, function(err, data) {
       if (err) {
         console.log(err, err.stack);
         reject(err)
       } else {
         resolve(data["Item"]["url"]);
       }
    });
  });
}

function generateUniqueKey() {
  return shortid.generate();
}
