#!/usr/bin/env node
/*
todo:
  -errorhandling
  -testing
  -let it run on other machine!
*/
//REQUIRES:
var telegram = require('telegram-bot-api'); //npm install telegram-bot-api im drüberliegenden Folder
var chessRules = require('chess-rules'); //https://www.npmjs.com/package/chess-rules
var jimp = require("jimp");//https://github.com/oliver-moran/jimp


//TOKENS:
var phil_token=   'XXXXXXXXX:GETYOUROWNTOKENXXXXXXX'

//BOTS:
var phil = new telegram({
    token: phil_token,
    updates: {
                enabled: true,
                get_interval: 1000
             }
});



var chess_map={};   //stores all running games
var figuren=[{type: 'P', bild: undefined},{type: 'R', bild: undefined},{type: 'N', bild: undefined},{type: 'B', bild: undefined},{type: 'Q', bild: undefined},{type: 'K', bild: undefined}]//P,R;N;B;Q;K
phil.on('message', function(message)
{
    var chat_id = message.chat.id;
    var user_id = message.from.id;
    var txt     = message.text;
    console.log(message.text)

    //START NEW GAME:
    if(txt.startsWith('chess'))
    {
      start_new_game(chat_id,txt, function(){
        draw_chess(chat_id);
      })
    }

    if(!(typeof chess_map[chat_id] === 'undefined'))
    {
      //move player:
      if(txt.startsWith('move')||txt.startsWith('Move'))
      {
        move_chess(chat_id,txt, function(){
          draw_chess(chat_id);
      })
      }
    }
})

/*
draws a chat situation:
*/

function draw_chess(chat_id){
  jimp.read("./board.png", function (err, board_pic)              //BOARD
  {
    var itemsProcessed=0
    figuren.forEach(function(figur_i)
    {
        jimp.read("./"+figur_i.type+".png", function(err,figur_pic)    //FIGUREN
        {
            figur_i.bild=figur_pic //store in
            itemsProcessed++;
            if(itemsProcessed === figuren.length)
            {
                //console.log("LOADING OF PICS DONE")
//LOADING DONE

//CHECK EACH FIELD
                var counter=0
                chess_map[chat_id].board.forEach(function(field_i)
                {
                    if(field_i!=null)//field is not empty
                    {
                        var figur_to_draw
//FIND RIGHT PIC OF FIGUR
                        figuren.forEach(function(figur_i)
                        {
                            if(field_i.type==figur_i.type) //BAUER
                            {
                                figur_to_draw=figur_i.bild
                            }
                        })

                        if(figur_to_draw!=undefined)
                        {
                            var insert=figur_to_draw.clone()
                            var inse
                            if(field_i.side=='W')//COLOR:Black
                            {
//INVERT COLOR OF FIGUR
                                insert=insert.invert()
                            }
//DRAW FIGUR AT RIGHT PLACE
                            var width=counter%8
                            var deepth=7-Math.floor(counter/8);
                            board_pic.composite(insert,46+68*width,46+68*deepth)
                        }
                    }
                    counter++;
                });
                board_pic.write("output"+chat_id.toString()+".png", function(){
                  phil.sendPhoto({chat_id: chat_id, photo: "./output"+chat_id.toString()+".png", caption: JSON.stringify(chessRules.positionToFen(chess_map[chat_id])) });
                });
            }
        })
    })
  })
}

function move_chess(chat_id,txt, callback){
  var arrayOfStrings = txt.split(" ");
  //input: move a2 b3
  //ein schachposition ist eine zahl zwischen 0-7 für die
  //erste zeile.. 8-17...
  var source=0;
  if(arrayOfStrings[1].charAt(0)=='a')
  {
    source=0
  }else if(arrayOfStrings[1].charAt(0)=='b'){
    source=1
  }else if(arrayOfStrings[1].charAt(0)=='c'){
    source=2
  }else if(arrayOfStrings[1].charAt(0)=='d'){
    source=3
  }else if(arrayOfStrings[1].charAt(0)=='e'){
    source=4
  }else if(arrayOfStrings[1].charAt(0)=='f'){
    source=5
  }else if(arrayOfStrings[1].charAt(0)=='g'){
    source=6
  }else if(arrayOfStrings[1].charAt(0)=='h'){
    source=7
  }

  source=source+8*(parseInt(arrayOfStrings[1].charAt(1))-1)
  var destin=0
  if(arrayOfStrings[2].charAt(0)=='a')
  {
    destin=0
  }else if(arrayOfStrings[2].charAt(0)=='b'){
    destin=1
  }else if(arrayOfStrings[2].charAt(0)=='c'){
    destin=2
  }else if(arrayOfStrings[2].charAt(0)=='d'){
    destin=3
  }else if(arrayOfStrings[2].charAt(0)=='e'){
    destin=4
  }else if(arrayOfStrings[2].charAt(0)=='f'){
    destin=5
  }else if(arrayOfStrings[2].charAt(0)=='g'){
    destin=6
  }else if(arrayOfStrings[2].charAt(0)=='h'){
    destin=7
  }

  destin=destin+8*(parseInt(arrayOfStrings[2].charAt(1))-1)
  var move_p={}
  move_p["src"]=source
  move_p["dst"]=destin
  var options =chessRules.getAvailableMoves(chess_map[chat_id])
  var possible = false;

  for (var i = 0; i < options.length; i++) {
    if (JSON.stringify(options[i]) == JSON.stringify(move_p))
    {
        console.log("possible");
        possible=true
    }
  }

  if(!possible)
  {
    phil.sendMessage({chat_id: chat_id, text:"wrong turn" }) //chess_mapchess_map[chat_id] })
  }else{
    chess_map[chat_id]=chessRules.applyMove(chess_map[chat_id], move_p);
    callback()
  }
}

function start_new_game(chat_id,txt, callback){
  if(!(typeof chess_map[chat_id] === 'undefined'))
  {
    //OVERWRITE LAST GAME
    phil.sendMessage({chat_id: chat_id, text:"KILL, NEW game:" })
  }else{
    //NEW GAME
    phil.sendMessage({chat_id: chat_id, text:"NEW game:" })
  }
  //alternative start position
  var arrayOfStrings = txt.split(" ");
  console.log(arrayOfStrings.length)
  if(arrayOfStrings.length==1)
  {
    chess_map[chat_id]=chessRules.getInitialPosition();
  }else{
    var position=''
    for (var i = 1; i < arrayOfStrings.length; i++) {
      if(!(i==arrayOfStrings.length-1))
      {
        console.log("not")
        position+=arrayOfStrings[i]+' ';
      }else{
        console.log("last")
        position+=arrayOfStrings[i];
      }
    }
    chess_map[chat_id]=chessRules.fenToPosition(position);
  }

  callback();
}
