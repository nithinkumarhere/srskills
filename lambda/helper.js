const HOSTNAME = "srdev.nimbusray.com";
const PORT = 9000;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNwb25zZSI6eyJpZCI6NDEsInVzZXJuYW1lIjoicmFqYXBlZXIiLCJlbWFpbCI6InJhakBuaW1idXNyYXkuY29tIiwibG9naW5UeXBlIjoiZ21haWwifSwiaWF0IjoxNTg5MzY0NzM1fQ.qsKKq6klqRzxq9WnVIi2aJxdc-ISrKbNG667nE20k6g'
const https = require("https");

const GET_COUNTRYSEARCH_API = '/country/searchCountry/';
const GET_COUNTRYASSOC_API = '/countryAssc/';
const GET_COMPANIES_API = '/countryAssc/companies/';
const GET_INDIVIDUALS_API = '/countryAssc/individuals/';
const SEND_EMAIL_API = '/country/email/';

exports.fallback = function(state) {
  var speechOutput;
  var reprompt;
        switch(state) {
          case "QueryCompleted":
            return speechOutput = "You just started with asking sanctions try asking that.";
          case "ConfirmCompleted":
            return speechOutput = "we ere in middle of action confirmation, you want me to stop?";
          case "ReadInProgress":
            return speechOutput = "read out is in progress, if you want to stop, say stop.";
          case "started":
            return speechOutput = "sorry i cant take action with that please try to ask sanctions";
          default:
            return speechOutput = "Sorry, current skill cant do that. ask some thing related to sanction rules";
    }
}

function preparePath(country, API_TYPE, type, email){
    var path;
    switch(API_TYPE) {
      case 1:
        return path = GET_COUNTRYSEARCH_API + encodeURIComponent(country);
      case 2:
        return path = GET_COUNTRYASSOC_API + encodeURIComponent(country)
     case 6:
        return path = SEND_EMAIL_API + encodeURIComponent(type) +'/' +encodeURIComponent(country) +'/' + encodeURIComponent(email);
     case 7: 
        return path =  GET_COMPANIES_API + encodeURIComponent(country) +'/' + encodeURIComponent(email);
     case 8: 
        return path =  GET_INDIVIDUALS_API + encodeURIComponent(country) +'/' + encodeURIComponent(email);
      default:
        // code block
    }
}

exports.fetchData = function(country, API_TYPE,type, USER_EMAIL) {
    
    return new Promise(((resolve, reject) => {
        const confirmedPath = preparePath(country, API_TYPE,type, USER_EMAIL);        
        const options = {
            hostname: HOSTNAME,
            port: PORT,
            headers: {'Authorization': "Bearer "+ token},
            path: confirmedPath,
            method: 'GET',
            "rejectUnauthorized": false,
        };
        
        const request = https.request(options, (res) => {

            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }

            // cumulate data
            var data = [];
            res.on('data', function (chunk) {
                data.push(chunk);
            });

            // resolve on end
            res.on('end', function () {
                var speakOutput = "";
                try {
                    data = JSON.parse(Buffer.concat(data).toString());
                } catch (e) {
                    reject(e);
                }

                resolve(data)
            });

            res.on('error', (error) => {
                reject(error);
            });

        });
        request.end();
    }));
}