const scriptProperties = PropertiesService.getScriptProperties();
const ACCESS_TOKEN = scriptProperties.getProperty('ACCESS_TOKEN');

const wordsId = '1BiDeYFDhD4aXT7hIag_L0uJuOiSY84_s';
const wordsFile = DriveApp.getFileById(wordsId);
const wordsArray = wordsFile.getBlob().getDataAsString("UTF-8").split(",");

const rule = {
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "hello, world"
      }
    ]
  }
};



function getWords(str){
  str = str.replace(/？/g, ".")  // １文字
  str = str.replace(/~/g, ".*").replace(/～/g, ".*").replace(/～/g, ".*");  // 含む
  str = str.replace(/\]/g, "]+").replace(/\(/g, "(?=").replace(/\=!/g, "!").replace(/\{/g, "(").replace(/\}/g, ")");
  console.log(str);
  if(/\-/.test(str)){
    let strArray = str.split("-");
    let head = strArray[0];
    str = strArray[1];

    if(head === "a"){
      var headRgx = /[a-z]+/;
    }
    else if(head === "k"){
      var headRgx = /[\u3005-\u3006\u4E00-\u9FFF]+/;
    }
    else{
      var headRgx = /[\u3040-\u309F\u3005-\u3006\u4E00-\u9FFF]+/;
    }
  }
  else{
    var headRgx = /[\u3040-\u309F]+/;
  }

  str = "/^" + str + "$/";

  let result = wordsArray.filter(RegExp.prototype.test,eval(str));
  result = result.filter(function(value) { return value.match(headRgx); });

  if(result.length === 0){
    return "みつからなかった😣"
  }
  return "「"+result.join(", ")+"」がみつかったよ😊";
}

// テスト
function myFunction() {
  // h-
  console.log(getWords("～あ？？ん～"));
}

function doPost(e){
  var event = JSON.parse(e.postData.contents).events[0];
  var reply_token = event.replyToken;

  if(event.type === "follow"){
    var messages = [{
      "type":"flex",
      "altText":"rule",
      "contents":rule
    }];
  }
  else if(event.type === "message"){
    if(event.message.type === "text"){
      var text = event.message.text;

      switch(text){
        case("ルール"):
          var messages = [{
            "type":"flex",
            "altText":"rule",
            "contents":rule
            }];
          break;
        default:
          var messages = [{
            "type":"text",
            "text":getWords(text),
            "quickReply": {
              "items": [
                {
                  "type": "action",
                  "action": {
                    "type": "message",
                    "label": "ルール",
                    "text": "ルール"
                  }
                }
              ]
            }
          }];
      }
    }
  }
  sendReplyMessage(reply_token, messages); 
}

function sendReplyMessage(reply_token, messages){
  var url = 'https://api.line.me/v2/bot/message/reply';
  var res = UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages 
    }),
  });
  return res;
}
