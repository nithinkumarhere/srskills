// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

const axios = require("axios");
const helper = require("helper");
var next = [];
var previous = [];
var pager;

const APP_NAME = "Sanction Rules";
const messages = {
  NOTIFY_MISSING_PERMISSIONS: 'Please enable profile permissions in the Amazon Alexa app.',
  ERROR: 'Uh Oh. Looks like something went wrong.'
};

const EMAIL_PERMISSION = "alexa::profile:email:read";
const LAUNCH_SPEECHOUTPUT = 'Welcome, you are in sanction rules app, you can say does country india has sanctions or Help. Which would you like to try?'

const COUNTRYSEARCH_API_CODE = 1;
const COUNTRYASSOC_API_CODE = 2;
const TRAVELBAN_API_CODE = 3;
const FREEZEASSET_API_CODE = 4;
const EXPORTLICENSE_API_CODE = 5;
const SENDEMAIL_API_CODE = 6;
const COMPANIES_API_CODE = 7;
const INDIVIDUALS_API_CODE = 8;
var intentConfirmState = '';

var q1States = {
  started: 'started',
  Query: 'QueryCompleted',
  Confirm: 'ConfirmCompleted',
  ReadOut: 'ReadInProgress',
  ended: 'ended'
};

var q1CurrentState;


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = LAUNCH_SPEECHOUTPUT;
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.q1CurrentState = q1States.started;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
    
};

// this is for intent 1
const CountryRestrictionsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'CountryRestrictions';
    },
   async handle(handlerInput) {
        resetSlots()

        const country = handlerInput.requestEnvelope.request.intent.slots.country.value;
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.countryValue = country;
        attributesManager.setSessionAttributes(attributes);

        if (attributes.q1CurrentState === "started" || attributes.q1CurrentState === "ended") {
            if(country !== undefined){
                var speakOutput = "";
                var data = await helper.fetchData(country, COUNTRYSEARCH_API_CODE,'both', '');
                    if (data.companies === 0 && data.persons !== 0) {
                        var personCount = data.persons;
                        speakOutput = `Country ${country} have sanctions. It has ${personCount} Individual sanctions on them. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q1";
                        attributes.q1CurrentState = "QueryCompleted";
                    } else if(data.companies !== 0 && data.persons === 0){
                        var companyCount = data.companies;
                        speakOutput = `Country ${country} have sanctions. It has ${companyCount} companies sanctions on them. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q1";
                        attributes.q1CurrentState = "QueryCompleted";
                    } 
                    else if (data.companies > 0 && data.persons > 0){
                        speakOutput = `Country ${country} have sanctions. It has ${data.companies} companies and ${data.persons} individuals. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q1";
                        attributes.q1CurrentState = "QueryCompleted";
                    } else {
                        speakOutput = `You don't have any restriction for the Country ${country} on trading or exporting goods.`;
                        attributes.q1CurrentState = "ended";
                    }
                    var repromptSpeech = `Do you want me to send these to your email? or read them out?`;
                    
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(repromptSpeech)
                        .withShouldEndSession(false)
                        .getResponse()
            }else{
                const speakOutput = `Sorry, I had trouble doing what you asked. Please try again`
                intentConfirmState = '';
                clearQ1Array();
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(speakOutput)
                    .getResponse();
            }  
        }else{
            const speechObj = helper.fallback(attributes.q1CurrentState);
            intentConfirmState = '';
            clearQ1Array();
            resetSlots();
            return handlerInput.responseBuilder
                .speak(speechObj)
                .reprompt(speechObj)
                .getResponse();
        }
    }
};

// this is for intent 2
const CompanyRestrictionsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'CompanyRestrictions';
    },
   async handle(handlerInput) {
        resetSlots()

        const country = handlerInput.requestEnvelope.request.intent.slots.country.value;
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.countryValue = country;
        attributesManager.setSessionAttributes(attributes);

        if (attributes.q1CurrentState === "started" || attributes.q1CurrentState === "ended") {
            if(country !== undefined){
                var speakOutput = "";
                var data = await helper.fetchData(country, COMPANIES_API_CODE,'company', '');
                    if(data.length !== 0){
                        var companyCount = data.length;
                        speakOutput = `Country ${country} have sanctions. It has ${companyCount} companies sanctions on them. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q2";
                        attributes.q1CurrentState = "QueryCompleted";
                    }else if (data.length === 0){
                        speakOutput = `You don't have any restriction for the Country ${country} on trading or exporting goods.`;
                        attributes.q1CurrentState = "ended";
                    } else {
                        speakOutput = `Country ${country} have sanctions. It has ${companyCount} companies. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q2";
                        attributes.q1CurrentState = "QueryCompleted";
                    }
                    
                    var repromptSpeech = `Do you want me to send these to your email? or read them out?`;
                    
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(repromptSpeech)
                        .withShouldEndSession(false)
                        .getResponse()
            }else{
                const speakOutput = `Sorry, I had trouble doing what you asked. Please try again`
                intentConfirmState = '';
                clearQ1Array();
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(speakOutput)
                    .getResponse();
            }  
        }else{
            const speechObj = helper.fallback(attributes.q1CurrentState);
            intentConfirmState = '';
            clearQ1Array();
            resetSlots();
            return handlerInput.responseBuilder
                .speak(speechObj)
                .reprompt(speechObj)
                .getResponse();
        }
    }
};

// this is for intent 3
const IndividualRestrictionsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'IndividualRestrictions';
    },
   async handle(handlerInput) {
        resetSlots()

        const country = handlerInput.requestEnvelope.request.intent.slots.country.value;
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.countryValue = country;
        attributesManager.setSessionAttributes(attributes);

        if (attributes.q1CurrentState === "started" || attributes.q1CurrentState === "ended") {
            if(country !== undefined){
                var speakOutput = "";
                var data = await helper.fetchData(country, INDIVIDUALS_API_CODE,'individual', '');
                    if(data.length !== 0){
                        var companyCount = data.length;
                        speakOutput = `Country ${country} have sanctions. It has ${companyCount} individuals sanctions on them. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q3";
                        attributes.q1CurrentState = "QueryCompleted";
                    }else if (data.length === 0){
                        speakOutput = `You don't have any restriction for the Country ${country} on trading or exporting goods.`;
                        attributes.q1CurrentState = "ended";
                    } else {
                        speakOutput = `Country ${country} have sanctions. It has ${companyCount} individuals. Do you want me to send these to your email? or read them out?`;
                        intentConfirmState = "q3";
                        attributes.q1CurrentState = "QueryCompleted";
                    }
                    
                    var repromptSpeech = `Do you want me to send these to your email? or read them out?`;
                    
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(repromptSpeech)
                        .withShouldEndSession(false)
                        .getResponse()
            }else{
                const speakOutput = `Sorry, I had trouble doing what you asked. Please try again`
                intentConfirmState = '';
                clearQ1Array();
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(speakOutput)
                    .getResponse();
            }  
        }else{
            const speechObj = helper.fallback(attributes.q1CurrentState);
            intentConfirmState = '';
            clearQ1Array();
            resetSlots();
            return handlerInput.responseBuilder
                .speak(speechObj)
                .reprompt(speechObj)
                .getResponse();
        }
    }
};

const ExportLicenseIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'ExportLicense';
    },
   async handle(handlerInput) {
        resetSlots()

        const country = handlerInput.requestEnvelope.request.intent.slots.country.value;
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.countryValue = country;
        attributesManager.setSessionAttributes(attributes);

        if (attributes.q1CurrentState === "started" || attributes.q1CurrentState === "ended") {
            if(country !== undefined){
                var speakOutput = "";
                var data = await helper.fetchData(country, COUNTRYSEARCH_API_CODE,'both', '');
                    if (data.companies === 0 && data.persons !== 0) {
                        var personCount = data.persons;
                        speakOutput = `There are ${personCount} sanctions on individuals in ${country}. It is important to you speak with your local chamber of commerce. The export control joint unit or your business advisor`
                        intentConfirmState = "q4";
                        attributes.q1CurrentState = "ended";
                    } else if(data.companies !== 0 && data.persons === 0){
                        var companyCount = data.companies;
                        speakOutput = `There are ${companyCount} sanctions on companies in ${country}. It is important to you speak with your local chamber of commerce. The export control joint unit or your business advisor`
                        intentConfirmState = "q4";
                        attributes.q1CurrentState = "ended";
                    }else if (data.companies > 0 && data.persons > 0){
                        speakOutput = `There are are ${data.persons} individuals and ${data.companies} companies in ${country}. It is important to you speak with your local chamber of commerce. The export control joint unit or your business advisor`
                        intentConfirmState = "q4";
                        attributes.q1CurrentState = "ended";
                    } else {
                        speakOutput = `There are no known sanctions of ${country}. However, depending on your product you might require a license. It is important that you get in touch with your local chamber of commerce or your business advisor`;
                        attributes.q1CurrentState = "ended";
                    }
                    var repromptSpeech = `Sure, if you want to know what else i can do, say help.`;
                    
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(repromptSpeech)
                        .withShouldEndSession(false)
                        .getResponse()
            }else{
                const speakOutput = `Sorry, I had trouble doing what you asked. Please try again`
                intentConfirmState = '';
                clearQ1Array();
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(speakOutput)
                    .getResponse();
            }  
        }else{
            const speechObj = helper.fallback(attributes.q1CurrentState);
            intentConfirmState = '';
            clearQ1Array();
            resetSlots();
            return handlerInput.responseBuilder
                .speak(speechObj)
                .reprompt(speechObj)
                .getResponse();
        }
    }
};

const ReadOutIntentHandler = {
    canHandle(handlerInput) {
        return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReadOut');
    },
    async handle(handlerInput) {

        const attributesManager = handlerInput.attributesManager;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const responseBuilder = handlerInput.responseBuilder;
        const country = attributes.countryValue;
       
        
        if(attributes.q1CurrentState === "QueryCompleted"){
            
            if(country !== undefined){
                var speakOutput = "";
                switch(intentConfirmState){
                    case 'q1':
                        var countryData = await helper.fetchData(country, COUNTRYASSOC_API_CODE,'both', '');
                        var sanctionsCount = countryData.length;
                        next = countryData;
                        if(sanctionsCount <= 5) {
                            speakOutput = `Since ${country} having a list of ${sanctionsCount} sanction(s), do you want me to read these items once, say yes or no?`;
                        } else {
                            speakOutput = `Since ${country} having a list of ${sanctionsCount} sanction(s), do you want me to read first few items once, say yes or no?`
                        }
                        
                        intentConfirmState = "q1"; 
                        attributes.q1CurrentState = "ConfirmCompleted";
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(`do you want me to read first few items once?`)
                            .withShouldEndSession(false)
                            .getResponse()                      

                    case 'q2':
                        var companyData = await helper.fetchData(country, COMPANIES_API_CODE,'company', '');
                        var companiesCount = companyData.length;
                        next = companyData;
                        if(companiesCount <= 5) {
                            speakOutput = `Since ${country} having a list of ${companiesCount} sanction(s), do you want me to read these items once, say yes or no?`;
                        } else {
                            speakOutput = `Since ${country} having a list of ${companiesCount} sanction(s), do you want me to read first few items once, say yes or no?`
                        }
                        
                        intentConfirmState = "q2"; 
                        attributes.q1CurrentState = "ConfirmCompleted";
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(`do you want me to read first few items once?`)
                            .withShouldEndSession(false)
                            .getResponse()                      
                            
                    case 'q3':
                        var individualData = await helper.fetchData(country, INDIVIDUALS_API_CODE,'individual', '');
                        var individualsCount = individualData.length;
                        next = individualData;
                        if(individualsCount <= 5) {
                            speakOutput = `Since ${country} having a list of ${individualsCount} sanction(s), do you want me to read these items once, say yes or no?`;
                        } else {
                            speakOutput = `Since ${country} having a list of ${individualsCount} sanction(s), do you want me to read first few items once, say yes or no?`
                        }
                        
                        intentConfirmState = "q2"; 
                        attributes.q1CurrentState = "ConfirmCompleted";
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(`do you want me to read first few items once?`)
                            .withShouldEndSession(false)
                            .getResponse()                      
                        
                    case 'q4':
                        
                        intentConfirmState = "q4"; 
                        attributes.q1CurrentState = "ended";
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(`Sure, if you want to know what else i can do, say help.`)
                            .withShouldEndSession(false)
                            .getResponse()                        

                    default:
                }
            }else{
                const speakOutput = `Sorry, I had trouble doing what you asked. Please try again`
                intentConfirmState = '';
                clearQ1Array();
                resetSlots();
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(speakOutput)
                    .getResponse();
            }
        }else{
                const speechObj = helper.fallback(attributes.q1CurrentState);
                intentConfirmState = '';
                clearQ1Array();
                resetSlots();
                return handlerInput.responseBuilder
                    .speak(speechObj)
                    .reprompt(speechObj)
                    .getResponse();   
        }
        
    }
};

const YesNoIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.YesIntent' || request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            const responseBuilder = handlerInput.responseBuilder;
            const attributesManager = handlerInput.attributesManager;
            const attributes = handlerInput.attributesManager.getSessionAttributes();
            const country = attributes.countryValue;
            
            if(attributes.q1CurrentState === "ConfirmCompleted" || attributes.q1CurrentState === "ReadInProgress"){
                 if (request.intent.name === 'AMAZON.YesIntent') {
                    let yesSpeech = readList(handlerInput);
                    return responseBuilder
                        .speak(yesSpeech)
                        .reprompt("Shall i read out next few items? yes or no")
                        .withShouldEndSession(false)
                        .getResponse();               
                } else {
                    
                    var noSpeachText = `Sure, if you want to know what else i can do, say help.`;
                    intentConfirmState = '';
                    clearQ1Array();
                    resetSlots();
                    attributes.q1CurrentState = "ended";  
                    return responseBuilder
                        .speak(noSpeachText)
                        .reprompt(noSpeachText)
                        .withShouldEndSession(false)
                        .getResponse();
                }
            }else{
                const speechObj = helper.fallback(attributes.q1CurrentState);
                intentConfirmState = '';
                clearQ1Array();
                resetSlots();
                return handlerInput.responseBuilder
                    .speak(speechObj)
                    .reprompt(speechObj)
                    .getResponse();                 
            }

    },
};

const SendEmailIntent_Handler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendEmail');
    },
    async handle(handlerInput) {
            const request = handlerInput.requestEnvelope.request;
            const responseBuilder = handlerInput.responseBuilder;
            const attributesManager = handlerInput.attributesManager;
            const attributes = handlerInput.attributesManager.getSessionAttributes();
            const country = attributes.countryValue;
            if(attributes.q1CurrentState === "QueryCompleted" || attributes.q1CurrentState === "ReadInProgress" ){
                    const { serviceClientFactory, responseBuilder } = handlerInput;
                    try {
                          const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                          const profileEmail = await upsServiceClient.getProfileEmail();
                              if (!profileEmail) {
                                const noEmailResponse = `It looks like you don't have an email set. You can set your email from the companion app.`
                                return handlerInput.responseBuilder
                                              .speak(noEmailResponse)
                                              .getResponse();
                              }
                              let res;
                              if(intentConfirmState === 'q1' || intentConfirmState === 'q4'){
                                  res =  await helper.fetchData(country, SENDEMAIL_API_CODE,'both', profileEmail);
                              }
                              if(intentConfirmState === 'q2'){
                                  res =  await helper.fetchData(country, SENDEMAIL_API_CODE,'company', profileEmail);
                              }
                              if(intentConfirmState === 'q3'){
                                  res =  await helper.fetchData(country, SENDEMAIL_API_CODE,'individual', profileEmail);
                              }
                            //var res =  await helper.fetchData(country, SENDEMAIL_API_CODE, profileEmail);
                            if(res === 'No data'){
                                    const speechResponse = `Uh oh!, Something wrong i could'nt send you email please try again by asking the question.`;
                                    intentConfirmState = '';
                                    clearQ1Array();
                                    resetSlots();
                                    attributes.q1CurrentState = "ended";  
                                     return handlerInput.responseBuilder
                                                      .speak(speechResponse)
                                                      .getResponse();
                            } else{
                                    const speechResponse = `Done!, sanctions list of ${country} email is sent to your ${profileEmail} please check.`;
                                    intentConfirmState = '';
                                    clearQ1Array();
                                    resetSlots();
                                    attributes.q1CurrentState = "ended";  
                                     return handlerInput.responseBuilder
                                                      .speak(speechResponse)
                                                      .getResponse();
                            }
                               
                        } catch (error) {
                              if (error.statusCode === 403) {
                                    intentConfirmState = '';
                                    clearQ1Array();
                                    resetSlots();
                                    return handlerInput.responseBuilder
                                    .speak(messages.NOTIFY_MISSING_PERMISSIONS)
                                    .withAskForPermissionsConsentCard([EMAIL_PERMISSION])
                                    .getResponse();
                              }
                        }
            }else{
                const speechObj = helper.fallback(attributes.q1CurrentState);
                intentConfirmState = '';
                clearQ1Array();
                resetSlots();
                return handlerInput.responseBuilder
                    .speak(speechObj)
                    .reprompt(speechObj)
                    .getResponse();   
            }
    },
};

const NoBothIntent_Handler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'NoBoth');
    },
    handle(handlerInput) {
            const speakOutput = `That's okay i wont take any action, To know what else i can do fo you, just say help. `
                intentConfirmState = '';
                clearQ1Array();
                resetSlots();
            return handlerInput.responseBuilder
                .speak(speakOutput)
                //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
                .getResponse();
            
    },
};

function getPagerName(){
    if(previous.length === 0){
        return pager = "first"
    }else{
        return pager = "next"
    }
}

function clearQ1Array() {
  next = [];
  previous = [];
}

function resetSlots(){
    intentConfirmState = '';
}

function readList(handlerInput){
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    const attributesManager = handlerInput.attributesManager;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
            
    var speakout = [];
    var pagerText = getPagerName();
    
    if(next.length === 5){
        attributes.q1CurrentState = "ended"; 
        var arrayLength1 = next.length;
        for(var i = 0; i < arrayLength1; i++) {
            previous.push((next[i].type === 0) ? "Company " + next[i].name.replace("&", "AND") : "Individual "  + next[i].name.replace("&", "AND"));
            speakout.push((next[i].type === 0) ? "Company " + next[i].name.replace("&", "AND") : "Individual "  + next[i].name.replace("&", "AND"));           
        }
        yesSpeachText = `Here are ${arrayLength1} item(s), ${speakout.toString()}. That's all you heard everything, if you want to know another sanctions please ask again.`;
        speakout = [];
        return yesSpeachText;
    }
    else {
        var arrayLength = next.length >= 5 ? 5 : next.length;
        for(var j = 0; j < arrayLength; j++) {
            previous.push((next[j].type === 0) ? "Company " + next[j].name.replace("&", "AND") : "Individual "  + next[j].name.replace("&", "AND"));
            speakout.push((next[j].type === 0) ? "Company " + next[j].name.replace("&", "AND") : "Individual "  + next[j].name.replace("&", "AND"));           
        }
    
        next.splice(0, arrayLength);
        
        var yesSpeachText;
        if(arrayLength >= 5){
            attributes.q1CurrentState = "ReadInProgress"; 
            yesSpeachText = `Here are ${pagerText} ${arrayLength} item(s), ${speakout.toString()}. still there are ${next.length}, Do you want me to tell next few items, yes or no?`;
            speakout = [];
            return yesSpeachText;
        }
        
        else{
            clearQ1Array();
            resetSlots();
            attributes.q1CurrentState = "ended";
            yesSpeachText = `Here are last ${arrayLength} item(s), ${speakout.toString()}.  That's all you heard everything, if you want to know another sanctions please ask again.`;
            speakout = [];
            return yesSpeachText;
        }
    }
    
}


function clearQ1Array() {
  next = [];
  previous = [];
}

function resetSlots(){

    intentConfirmState = '';
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {

    return handlerInput.responseBuilder
      .speak("Sorry, I didnt get you, you can ask help if you want to.")
      .reprompt("Sorry, I didnt get you, you can ask help if you want to.")
      .getResponse();
    
  }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

function getSlotValues(filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                heardAs: filledSlots[item].value,
                resolved: '',
                ERstatus: ''
            };
        }
    }, this);

    return slotValues;
}


// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CountryRestrictionsIntentHandler,
        CompanyRestrictionsIntentHandler,
        IndividualRestrictionsIntentHandler,
        ExportLicenseIntentHandler,
        HelpIntentHandler,
        YesNoIntent_Handler,
        NoBothIntent_Handler,
        SendEmailIntent_Handler,
        ReadOutIntentHandler,
        FallbackIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
