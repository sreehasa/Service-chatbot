const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
global.user__name="";
app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});



async function register(agent){
  
  const no = agent.parameters.number;
  var person = agent.parameters.person;

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("chatbot");
      
    user__name = person.name;    
    var num=no; 
    
    var myobj = { user_name:user__name, number:num};
  
    dbo.collection("user_table").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
    });
  });
  agent.add("User Registered: "+ person.name +" \n Mobile Number: "+no);
  }

  async function identify_user(agent)  {
    
    const number = agent.parameters.number;
    const client = new MongoClient(url);
    await client.connect();
    const snap = await client.db("chatbot").collection("user_table").findOne({number:number});
    //console.log(snap);
    if(snap==null){
      await agent.add("Re-Enter your mobile number");
    }
    else{
    user__name=snap.user_name;
    await agent.add("Welcome  "+user__name+"!!  \n How can I help you");
    }
  }





function report_issue(agent)
{
  //console.log(agent);
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_number;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("chatbot");
    
  var u_name = user__name; 
  //console.log(user__name);   
  var issue_val=  val; 
  var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { user_name:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("issue_table").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}




//trying to load rich response
function custom_payload(agent)
{

	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}



async function track(agent)  {
  console.log(agent);
  const number = agent.parameters.ticket;
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("chatbot").collection("issue_table").findOne({trouble_ticket:number});
  
  if(snap==null){
    await agent.add("Re-Enter your ticket number");
  }
  else{
    username=snap.user_name;
    iss=snap.issue;
    stats=snap.status;
    time=snap.time_date;

    await agent.add(username+", your issue - "+iss+" entered on "+time+" is "+stats);
  }
}



var intentMap = new Map();
intentMap.set("Welcome->NotRegistered", register);
intentMap.set("Welcome-yes-identify", identify_user);
intentMap.set("InternetIssue", custom_payload);
intentMap.set("InternetIssue - custom", report_issue);
intentMap.set("Track-custom", track);
agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);