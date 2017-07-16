var securityterms = {
    "Intent Schema" : {
        "definition": "JSON structure which declares the set of intents your service can accept and process.",
        "preface":"a"
}


/* ================= constructor ================= */
exports.handler = function (event, context) {
    try {
        // ensure only legit app is calling this Lambda function
        if (event.session.application.applicationId !="[Amazon Skill ID]") {
           throw "Invalid Application ID"
        }
    
        if (event.session.new) {
          onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
        } catch(error) { context.fail(`Exception: ${error}`) }
};

function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/* ================= when an intent is called ================= */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "DefineIntent") {
        handleDefineResponse(intent, session, callback)
    } else if (intentName == "AMAZON.YesIntent") {
        handleYesResponse(intent, session, callback)
    } else if (intentName == "AMAZON.NoIntent") {
        handleNoResponse(intent, session, callback)
    } else if (intentName == "AMAZON.HelpIntent") {
        handleGetHelpRequest(intent, session, callback)
    } else if (intentName == "AMAZON.StopIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else if (intentName == "AMAZON.CancelIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else {
        throw "Invalid intent"
    }
}

function onSessionEnded(sessionEndedRequest, session) {

}

/* ================= provide greeting ================= */
function getWelcomeResponse(callback) {
    var speechOutput = `Welcome !`
    var reprompt = "Which term are you interested in?"
    var header = "Security Flashcards"
    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))
}

/* ================= define the term ================= */
function handleDefineResponse(intent, session, callback) {
    var securityterm = intent.slots.SecurityTerm.value.toLowerCase()
    var speechOutput = ""
    var repromptText = ""
    var header = ""

    if (!securityterms[securityterm]) {
        speechOutput = "That  term is not in my database."
        repromptText = "Try asking about another term"
        header = "Unknown"
    } else {
        var definition = securityterms[securityterm].definition
        var preface = securityterms[securityterm].preface
        if(preface!="") preface+=" "
        speechOutput = preface + securityterm + " is " + definition
        speechOutput += " Do you want to hear about more terms?"  
        repromptText = "Do you still want to hear about more terms?"
        header = capitalizeFirst(securityterm)
    }

    // put a bow on it  
    speechOutput = capitalizeFirst(speechOutput)

    var shouldEndSession = false
    callback(session.attributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession))
}

/* ================= handle yes response ================= */
function handleYesResponse(intent, session, callback) {
    // randomize first word
    var items = ["Great","Ok","Sure","Sounds good","Alright"];
    var item = items[Math.floor(Math.random()*items.length)];

    //var speechOutput = "Great! Which security term?"
    var speechOutput = item + "! Which security term?"
    var repromptText = speechOutput
    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
}

/* ================= handle no response ================= */
function handleNoResponse(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback)
}

/* ================= handle help response ================= */
function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    var speechOutput = "Please say define, followed by a term." 
    var repromptText = speechOutput
    var shouldEndSession = false
    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
}

/* ================= handle finish response ================= */
function handleFinishSessionRequest(intent, session, callback) {

    var items = ["Response A","Response B","Response C"];
    var item = items[Math.floor(Math.random()*items.length)];
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Ok. Thank you for using Security Flashcards! " + item + ".", "", true));
}


/* ================= build responses ================= */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
