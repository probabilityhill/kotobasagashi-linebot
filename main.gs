const scriptProperties = PropertiesService.getScriptProperties();
const ACCESS_TOKEN = scriptProperties.getProperty('ACCESS_TOKEN');

const wordsFile = DriveApp.getFilesByName("word.csv").next();
const wordsArray = wordsFile.getBlob().getDataAsString("UTF-8").split("\n");

const sheetId = "1Uo9_SrTYmpS8e8CqXTkFzO4h90BGVlWW1IOaVPtKn9o";
const data = SpreadsheetApp.openById(sheetId).getSheets()[0];  // シートを取得

const errorLogSheetId = "1D5l8a954MBg2VTpXOrRWjQbDAUWPN0B6HoZYXp4KlCk";
const errorLogSheet = SpreadsheetApp.openById(errorLogSheetId).getSheets()[0];  // シートを取得

const e2kId = "1IcvttHeFbdJuhnQoiAv1TIyi1KLnrttg";
const e2kFile = DriveApp.getFileById(e2kId);
const e2k = JSON.parse(e2kFile.getBlob().getDataAsString("UTF-8"));

const MESSAGE = {
  NOT_FOUND: () => "みつからなかった😣",
  TOO_MANY: () => "いっぱいあってさがしきれないよ😵",
  BUG_FOUND: () => "例外をキャッチした！改善するね🫠",
  INPUT_INCORRECT: () => "入力が正しくないよ😵",
  FOUND: (str) => str + "がみつかったよ😊",
};

function getE2kRgx(str){
  const kanjiArray = e2k[str];
  return kanjiArray ? "(" + kanjiArray.join("|") + ")" : str;
}

function tmp(){
  //makeSpreadSheet(getDeletedArray(wordsArray, ["", "", "", ""]));  // 手動で削除
  //makeSpreadSheet(getRemoveChinese(wordsArray, /.*[刭].*/));
  writeErrorLog("text", "e")
  //console.log(wordsArray.includes(""));
  //console.log(wordsArray[5])
  //addWords(wordsArray, ["さいぼう"]);
  //console.log(getWords("<月>..", /.+/));
  // console.log(simpleSearch("漢字ー～＜下＞～"));
  //console.log(getE2kRgx("月"));
  //console.log(xIsY("てかん","ひ"));
}

function getAddedArray(array, words){
  for (const x of words) {
    if (!array.includes(x)){
      array.push(x);
    } 
  }
  return array
}

function getRemoveChinese(array, rgx){
  return array.filter(x => !x.match(rgx))
}

function getDeletedArray(array, words){
  return array.filter(x => !words.includes(x))
}

// リクエスト実行
// data/word.csvが作成されるため古いものはbkへ
// デプロイする
function getRequests(){
  const reqId = "1Gdn4m4s0Aq9vf0PTNJ-4sqOZRqIuB96SSr9tEfp7478";
  const reqSheet = SpreadsheetApp.openById(reqId).getSheets()[0];  // リクエストを取得
  
  // 追加リクエスト
  var addList = []
  const addLastRow = reqSheet.getRange("A:A").getValues().filter(String).length; 
  for(let i = 2; i <= addLastRow; i++){
    addList.push(reqSheet.getRange(i,1).getValue());
  }
  var addedArray = getAddedArray(wordsArray, addList);
  reqSheet.getRange(2,1,addLastRow,1).clearContent();

  // 削除リクエスト
  var delList = []
  const delLastRow = reqSheet.getRange("B:B").getValues().filter(String).length;
  for(let i = 2; i <= delLastRow; i++){
    delList.push(reqSheet.getRange(i,2).getValue());
  }
  var deletedArray = getDeletedArray(addedArray, delList);
  reqSheet.getRange(2,2,delLastRow,1).clearContent();

  // 不要な漢字
  var chinese = ''
  const chineseLastRow = reqSheet.getRange("C:C").getValues().filter(String).length;
  for(let i = 2; i <= chineseLastRow; i++){
    chinese += reqSheet.getRange(i,3).getValue();
  }
  const pattern = new RegExp(`.*[${chinese}].*`);
  var chineseDeletedArray = getRemoveChinese(deletedArray, pattern);
  reqSheet.getRange(2,3,delLastRow,1).clearContent();

  // スプレッドシート生成
  makeSpreadSheet(chineseDeletedArray);
}

function makeSpreadSheet(array){
  var csv = array.join('\n');

  // Blobオブジェクトの作成
  var blob = Utilities.newBlob(csv, MimeType.CSV, 'word.csv');
  
  // CSVファイルの保存先フォルダを指定
  var id = '1s35bmgREfICvHK-8Eezgx51g7ZV8Ojfb'; //フォルダID
  var folder = DriveApp.getFolderById(id);

  // CSVファイルを作成
  folder.createFile(blob);
}

function simpleSearch(str){
  str = str.replace(/〜|～/g, "~").replace(/（(.+?)）/g, "($1)").replace(/・|／|\//g, "|")  // 記号の置換
  str = str.replace(/\?|？|．|。/g, ".");  // １文字
  str = str.replace(/~/g, ".*");  // 含む .*a.*
  str = getHalfWidth(str);  // 全角→半角
  
  // 行検索
  str = str.replace(/あ↓/g, "[あいうえお]").replace(/か↓/g, "[かきくけこがぎぐげご]").replace(/さ↓/g, "[さしすせそざじずぜぞ]").replace(/た↓/g, "[たちつてとだぢづでどっ]").replace(/な↓/g, "[なにぬねの]").replace(/は↓/g, "[はひふへほばびぶべぼぱぴぷぺぽ]").replace(/ま↓/g, "[まみむめも]").replace(/や↓/g, "[やゆよゃゅょ]").replace(/ら↓/g, "[らりるれろ]").replace(/わ↓/g, "[わを]");
  // 段検索
  str = str.replace(/あ→/g, "[あかがさざただなはばぱまやらわ]").replace(/い→/g, "[いきぎしじちぢにひびぴみり]").replace(/う→/g, "[うくぐすずつづぬふぶぷむゆる]").replace(/え→/g, "[えけげせぜてでねへべぺめれ]").replace(/お→/g, "[おこごそぞとどのほぼぽもよろを]");
  // 捨て仮名検索
  str = str.replace(/っ↓/g, "[っゃゅょ]");
  // 濁音検索
  str = str.replace(/が↓/g, "[がぎぐげござじずぜぞだぢづでどばびぶべぼ]");
  // 半濁音検索
  str = str.replace(/ぱ↓/g, "[ぱぴぷぺぽ]");
  // 母音検索
  str = str.replace(/a→/g, "[aeiou]");
  // 子音検索
  str = str.replace(/b→/g, "[bcdfghjklmnpqrstvwxyz]");

  replaceSameStr("X", 1);
  replaceSameStr("Y", 2);
  replaceSameStr("Z", 3);

  function replaceSameStr(x, num){
    str = str.replace(eval("/"+x+"/"), "(.)");  // 1つ目のxは(.)に置換
    str = str.replace(eval("/"+x+"/g"), "\\"+num);  // 2つ目以降のxはすべて\\idxに置換
  }
  if(/(漢字|ひ漢字|a)(\-|ー|‐|−|‑|–|—|―|ｰ|－)/.test(str)){
    str = str.replace(/ー|‐|−|‑|–|—|―|ｰ|－/g, "-");
    let strArray = str.split("-");
    let head = strArray[0];
    str = strArray[1];

    var headRgx = getFilterRgx(head);
  }
  else{
    // ひらがな
    var headRgx = getFilterRgx("ひ");
  }

  return getWords(str, headRgx);
}

function advancedSearch(pbData, array){
  let strRgx = null;


  for(var i = 0; i < array.length; i++){
    array[i] = getHalfWidth(array[i]).replace(/，|、/,",").replace(/（(.+?)）/g, "($1)").replace(/・|／|\//g, "|");  // 全角→半角、記号の置換
  }

  const filterRgx = getFilterRgx(array.slice(-1)[0]);  // 文字種フィルター

  switch(pbData){
    case("include-x"):
      var X = array[0];
      var N = array[1];
      if(N === "n"){
        strRgx = ".*"+X+".*";
      }
      else{
        strRgx = "(?=.*"+X+").{"+N+"}";
      }
      break;
    case("consist-of-x"):
      var X = array[0];
      var N = array[1];
      if(N === "n"){
        strRgx = "["+X+"]+";
      }
      else{
        strRgx = "["+X+"]{"+N+"}";
      }
      break;
    case("include-x-and-y"):
      var X = array[0];
      var Y = array[1];
      var N = array[2];
      if(N === "n"){
        strRgx = "(?=.*"+X+")(?=.*"+Y+").*";
      }
      else{
        strRgx = "(?=.*"+X+")(?=.*"+Y+").{"+N+"}";
      }
      break;
    case("not-include-x"):
      var X = array[0];
      var N = array[1];
      if(N === "n"){
        strRgx = "(?!.*"+X+").*";
      }
      else{
        strRgx = "(?!.*"+X+").{"+N+"}";
      }
      break;
    case("include-x-or-y"):
      var X = array[0];
      var Y = array[1];
      var N = array[2];
      if(N === "n"){
        strRgx = ".*("+X+"|"+Y+").*";
      }
      else{
        strRgx = "(?=.*("+X+"|"+Y+").*).{"+N+"}";
      }
      break;
    case("include-x-not-y"):
      var X = array[0];
      var Y = array[1];
      var N = array[2];
      if(N === "n"){
        strRgx = "(?=.*"+X+")(?!.*"+Y+").*";
      }
      else{
        strRgx = "(?=.*"+X+")(?!.*"+Y+").{"+N+"}";
      }
      break;
    case("consist-of-not-x"):
      var X = array[0];
      var N = array[1];
      if(N === "n"){
        strRgx = "[^"+X+"]+";
      }
      else{
        strRgx = "[^"+X+"]{"+N+"}";
      }
      break;
    case("x-is-y"):
      var X = array[0];
      return xIsY(X, array.slice(-1)[0]);
      break;
  }
  
  return getWords(strRgx, filterRgx);
}

function xIsY(bfStr, type){
  const hiraList = ["うがい", "えがお", "かがく", "かがみ", "かがむ", "かがわ", "きがえ", "ぎがん", "くがつ", "こがす", "ごがつ", "さがす", "さがる", "しがい", "しがつ", "すがお", "すがた", "すがむ", "せがれ", "せがん", "たがい", "たがめ", "ちがい", "ちがう", "つがい", "てがき", "てがた", "てがみ", "とがる", "ながい", "ながさ", "ながす", "ながの", "にがい", "にがす", "にがて", "にがり", "ねがい", "ねがう", "のがす", "はがき", "はがす", "はがね", "ひがい", "ひがさ", "ひがし", "ふがし", "まがお", "まがる", "みがく", "めがね", "めがみ", "もがく", "ゆがく", "あおがえる", "あかがえる", "あぼがどろ", "あまがえる", "あまがさき", "あみがしら", "ありがたい", "ありがとう", "いそがしい", "いやがらせ", "うしがえる", "えれがんと", "えんがちょ", "おにがしま", "おにがわら", "かんがえる", "かんがみる", "きりがみね", "ぎんがけい", "くつがえす", "くつがえる", "くにがまえ", "くもがくれ", "ごうがしゃ", "さどがしま", "さわがしい", "さんがにち", "ししがしら", "しずがたけ", "したがって", "じゃがいも", "するがわん", "せちがらい", "たえがたい", "たそがれる", "たつがしら", "たねがしま", "てながざる", "とうがらし", "なまがわき", "ねんがっぴ", "はこがまえ", "はつがつお", "はみがきこ", "ばいがえし", "ばすがいど", "ひきがえる", "ひるがえる", "ぶるがりあ", "まちがえる", "まぬがれる", "みしがんこ", "ものがたり", "ものがたる", "やたがらす", "やつがたけ", "よみがえる", "わかがえり", "わかがえる", "かたながりれい", "じさつがんぼう", "しょうがっこう", "むしずがはしる", "もりながせいか"];
  const alphaList = ["dish", "disk", "fish", "kiss", "list", "miss", "mist", "rise", "risk", "wise", "wish", "muisic", "poison", "prison", "desister", "division", "register"];

  function getConvertedStr(type){
    const convList = function(){
      if(type === "ひ"){
        return hiraList;
      }
      else{
        return alphaList;
      }
    };

    let afStr = "";
    let afStrList = [];
    for(let i = 0; i < convList().length; i++){
      let s = convList()[i];  // 変換用単語
      let sArray = s.split(/が|is/);  // 「が」または「is」で分割
      // sの前半がbfStrにあればsの後半に変換
      if(bfStr.indexOf(sArray[0]) > -1){
        
        afStr = bfStr.replace(eval("/"+sArray[0]+"/g"), sArray[1]);

        // 変換後の文字列が辞書にあれば配列に格納
        if(wordsArray.indexOf(afStr) > -1){
          afStrList.push(bfStr+" ―["+s+"]→ "+afStr);
        }
      }
    }

    if(afStrList.length === 0){
      return MESSAGE.NOT_FOUND();
    }
    else{
      const resultText = MESSAGE.FOUND(afStrList.join("\n") + "\n");
      if(resultText.length > 5000){
        return MESSAGE.TOO_MANY();
      }
      return resultText;
    }
  }

  return getConvertedStr(type);
}

function getHalfWidth(str){
  // 全角→半角
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

function getFilterRgx(type){
  if(type === "ひ"){
    return /^[\u3040-\u309F\u30FC]+$/;
  }
  else if(type === "a"){
    return /^[a-z]+$/;
  }
  else if(type === "漢字"){
    return /^[\u3005-\u3006\u4E00-\u9FFF]+$/;
  }
  else{
    // type === "ひ漢字"
    return /^[\u3040-\u309F\u3005-\u3006\u4E00-\u9FFF\u30FC]+$/;
  }
  
}

function getWords(str, filterRgx){
  str = str.replace(/IRO/g, "(紫|青|藍|紺|水|緑|黄|金|橙|朱|赤|茶|紅|桃|銀|灰|鼠|黒|白|虹|むらさき|あお|あい|こん|みず|みどり|き|きん|だいだい|しゅ|あか|ちゃ|べに|もも|ぎん|はい|ねずみ|くろ|しろ|にじ|purple|violet|blue|indigo|navy|water|green|yellow|gold|orange|red|brown|pink|silver|gray|grey|black|white|rainbow|cyan|magenta)");
  str = str.replace(/ETO/g, "(子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥|ね|うし|とら|う|たつ|み|うま|ひつじ|さる|とり|いぬ|い|rat|ox|tiger|rabbit|hare|dragon|snake|horse|sheep|monkey|rooster|dog|boar)");
  str = str.replace(/HOGAKU/g, "(東|西|南|北|east|west|south|north|ひがし|にし|みなみ|きた|とう|ざい|なん|ぼく)");
  str = str.replace(/SHIKI/g, "(春|夏|秋|冬|はる|なつ|あき|ふゆ|しゅん|か|しゅう|とう|spring|summer|autumn|fall|winter)");
  str = str.replace(/SUJI/g, "(零|一|二|三|四|五|六|七|八|九|十|百|千|万|億|兆|京|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand|million|billion|ぜろ|れい|いち|に|さん|し|ご|ろく|なな|はち|きゅう|じゅう|ひゃく|せん|まん|おく|ちょう|けい)");
  str = str.replace(/WEEK/g, "(月|火|水|木|金|土|日|げつ|か|すい|もく|きん|ど|にち|mon|tue|wed|thu|fri|sat|sun)");
  str = str.replace(/OTO/g, "(ど|れ|み|ふぁ|そ|ら|し|c|d|e|f|g|a|b)");
  str = str.replace(/GENSO/g, "(h|he|li|be|b|c|n|o|f|ne|na|mg|al|si|p|s|cl|ar|k|ca|sc|ti|v|cr|mn|fe|co|ni|cu|zn|ga|ge|as|se|br|kr|rb|sr|y|zr|nb|mo|tc|ru|rh|pd|ag|cd|in|sn|sb|te|i|xe|cs|ba|la|ce|pr|nd|pm|sm|eu|gd|tb|dy|ho|er|tm|yb|lu|ac|th|pa|u|np|pu|am|cm|bk|cf|es|fm|md|no|lr|hf|ta|w|re|os|ir|pt|au|hg|tl|pb|bi|po|at|rn|fr|ra|rf|db|sg|bh|hs|mt|ds|rg|cn|nh|fl|mc|lv|ts|og|水素|すいそ|へりうむ|りちうむ|べりりうむ|ほうそ|炭素|たんそ|窒素|ちっそ|酸素|さんそ|ふっそ|ねおん|なとりうむ|まぐねしうむ|あるみにうむ|けいそ|りん|硫黄|いおう|塩素|えんそ|あるごん|かりうむ|かるしうむ|すかんじうむ|ちたん|ばなじうむ|くろむ|まんがん|鉄|てつ|こばると|にっける|銅|どう|亜鉛|あえん|がりうむ|げるまにうむ|ひそ|せれん|臭素|しゅうそ|くりぷとん|るびじうむ|すとろんちうむ|いっとりうむ|じるこにうむ|におぶ|もりぶでん|てくねちうむ|るてにうむ|ろじうむ|ぱらじうむ|銀|ぎん|かどみうむ|いんじうむ|錫|すず|あんちもん|てるる|ようそ|きせのん|せしうむ|ばりうむ|たんぐすてん|うらん|いりじうむ|白金|はっきん|金|きん|水銀|すいぎん|たりうむ|鉛|なまり|びすます|らどん|らじうむ|らんたん|ふらんしうむ|あめりしうむ|きゅりうむ|にほにうむ|とりうむ)");
  str = str.replace(/<.>|＜.＞/g, function(s){
    return getE2kRgx(s.charAt(1));
  });  

  console.log(str);  // CHECK

  str = "/^" + str + "$/";

  let resultArray = wordsArray.filter(RegExp.prototype.test,eval(str));
  resultArray = resultArray.filter(RegExp.prototype.test,eval(filterRgx));  // 文字種フィルタ

  resultArray.sort();

  if(resultArray.length === 0){
    return MESSAGE.NOT_FOUND();
  }
  const resultText = MESSAGE.FOUND("「" + resultArray.join(", ") + "」");
  if(resultText.length > 5000){
    return MESSAGE.TOO_MANY();
  }
  return resultText;
}

function writeErrorLog(text, e){
  const writeRow = errorLogSheet.getLastRow() + 1;
  const nowDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd hh:mm:ss')
  errorLogSheet.getRange(writeRow, 1, 1, 3).setValues([[nowDate, text, e]]);
}

function getUserName(){
  const lastRow = data.getLastRow();  // 最終行取得
  for(let i = 1; i <= lastRow; i++){
    if(data.getRange(i,3).isBlank()){
      const userId = data.getRange(i,1).getValue();
      const url = 'https://api.line.me/v2/bot/profile/' + userId;
      try {
        const userProfile = UrlFetchApp.fetch(url,{
          'headers': {
            'Authorization' :  'Bearer ' + ACCESS_TOKEN,
          },
        });
        data.getRange(i,3).setValue(JSON.parse(userProfile).displayName);
        data.getRange(i,4).setValue(JSON.parse(userProfile).statusMessage);
        data.getRange(i,5).setValue(JSON.parse(userProfile).pictureUrl);
      } catch (e) {
        console.log(`row: ${i}, ${e}`);
        data.getRange(i,3).setValue('Not found');
        data.getRange(i,4).setValue('Not found');
        data.getRange(i,5).setValue('Not found');
      }
    }
  }
}

function countWords(){
  let countArray = wordsArray.filter(RegExp.prototype.test,eval(/^[a-z]+$/));
  console.log(wordsArray.length);
  // 	ひらがなのみ：77504, 熟語：47183, ひらがなと漢字混合：5739, 英単語：121946
}

function doPost(event){
  const events = JSON.parse(event.postData.contents).events;
  for (const evt of events) {
    try {
      execute(evt);
    } catch(e) {
      writeErrorLog(evt, e);
    }
  }
}

function execute(event){
  const eventType = event.type;
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  if(eventType === "follow"){
    const writeRow = data.getLastRow()+1;  // 書く行取得
    data.getRange(writeRow,1).setValue(userId);  // A列目にユーザID記入
    data.getDataRange().removeDuplicates([1]);  // ユーザIDの重複を削除

    const messages = [
      {
      "type":"flex",
      "altText":"使い方（基本）",
      "contents":ruleBasic
      },
      {
      "type":"flex",
      "altText":"使い方（高度）",
      "contents":ruleAdvanced
      },
      {
      "type":"flex",
      "altText":"使い方（特殊）",
      "contents":ruleUnique
      },
      {
        "type":"text",
        "text":"↓これがボタンパネルだよ！",
      },
      {
      "type":"flex",
      "altText":"ボタンパネル",
      "contents":btnList
      }
    ];
    sendReplyMessage(replyToken, messages); 
  }
  else if(eventType === "postback"){
    const pbData = event.postback.data;
    const userIdRow = data.createTextFinder(userId).findNext().getRow();  // ユーザIDが存在する行
    data.getRange(userIdRow,2).setValue(pbData);  // B列目にpbDataを記入
    let text = null;
    let input = "X Y N TYPE";

    switch(pbData){
      case("include-x"):
        text = "Xを含む";
        input = "X N TYPE";
        break;
      case("consist-of-x"):
        text = "XY…で構成される";
        input = "XY… N TYPE";
        break;
      case("consist-of-x-limited"):
        text = "XY…で構成される(M~N文字)";
        input = "XY… M N TYPE";
        break;
      case("include-x-and-y"):
        text = "XとYを含む";
        break;
      case("not-include-x"):
        text = "Xを含まない";
        input = "X N TYPE";        
        break;
      case("include-x-or-y"):
        text = "XまたはYを含む";
        break;
      case("include-x-not-y"):
        text = "Xを含むがYを含まない";
        break;
      case("consist-of-not-x"):
        text = "XY…以外で構成される";
        input = "XY… N TYPE";
        break;
      case("x-is-y"):
        text = "WORD -[単語]→ 単語";
        input = "WORD TYPE(ひ/a)";
        break;
    }
    const messages = [
      {
        "type":"flex",
        "altText":"入力形式",
        "contents":{
          "type": "bubble",
          "body": {
            "type": "box",
            "layout": "baseline",
            "contents": [
              {
                "type": "text",
                "weight": "bold",
                "contents": [
                  {
                    "type": "span",
                    "text": input+"　",
                    "size": "xs",
                    "color": "#375e97"
                  },
                  {
                    "type": "span",
                    "size": "xxs",
                    "color": "#BBBBBB",
                    "text": text
                  }
                ]
              }
            ],
            "paddingAll": "md",
            "paddingStart": "lg"
          }
        }
      }
    ];
    sendReplyMessage(replyToken, messages); 
  }
  else if(eventType === "message"){
    if(event.message.type === "text"){
      const text = event.message.text;
      let messages = null;
      
      try {
        switch(true){
          case(/^基本$/.test(text)):
            messages = [{
              "type":"flex",
              "altText":"使い方（基本）",
              "contents":ruleBasic,
              "quickReply": quickReply
              }];
            break;
          case(/^高度$/.test(text)):
            messages = [{
              "type":"flex",
              "altText":"使い方（高度）",
              "contents":ruleAdvanced,
              "quickReply": quickReply
              }];
            break;
          case(/^特殊$/.test(text)):
            messages = [{
              "type":"flex",
              "altText":"使い方（特殊）",
              "contents":ruleUnique,
              "quickReply": quickReply
              }];
            break;
          case(/^ボタン$/.test(text)):
            messages = [{
              "type":"flex",
              "altText":"ボタンパネル",
              "contents":btnList,
              "quickReply": quickReply
              }];
            break;
          case(/.*(\s|\u3000).*/.test(text)):
            // 高度な検索
            const userIdRow = data.createTextFinder(userId).findNext().getRow();  // ユーザIDが存在する行
            const pbData = data.getRange(userIdRow,2).getValue();  // B列目のpbDataを取得       
            const textArray = text.split(/\s|\u3000/);  // 空白で分割
            messages = [{
              "type":"text",
              "text":advancedSearch(pbData, textArray),
              "quickReply": quickReply
            }];
            break;
          default:
            // シンプルな検索
            messages = [{
              "type":"text",
              "text":simpleSearch(text),
              "quickReply": quickReply
            }];
        }
      } catch (e) {
        writeErrorLog(text, e);
        messages = [{
          "type":"text",
          "text":MESSAGE.BUG_FOUND(),
          "quickReply": quickReply
        }];
      }
      sendReplyMessage(replyToken, messages); 
    }
  }
}

function sendReplyMessage(replyToken, messages){
  var url = 'https://api.line.me/v2/bot/message/reply';
  var res = UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': messages 
    }),
  });
  return res;
}
