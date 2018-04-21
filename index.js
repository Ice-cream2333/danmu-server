var express = require('express');
var router = express.Router();

var app = express();
var server = require('http').Server(app);
var port = 7080;



app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  // res.header('Cache-control', 'no-cache');

  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

// 创建socket服务
var socketIO = require('socket.io')(server);
// 房间用户名单
var roomInfo = {};

socketIO.on('connection', function (socket) {
  // 获取请求建立socket连接的url
  // 如: http://localhost:3000/room/room_1, roomID为room_1
  var url = socket.request.headers.referer;
  var splited = url.split('/');
  var roomID = splited[splited.length - 1];   // 获取房间ID
  var user = '';

  socket.on('join', function (userName) {
    user = userName;

    // 将用户昵称加入房间名单中
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = [];
    }
    roomInfo[roomID].push(user);

    socket.join(roomID);    // 加入房间
    // 通知房间内人员
    // socketIO.to(roomID).emit('sys', user + '加入了房间', roomInfo[roomID]);  
    console.log(user + '加入了' + roomID);
  });

  socket.on('leave', function () {
    socket.emit('disconnect');
  });

  socket.on('disconnect', function () {
    // 从房间名单中移除
    var index = roomInfo[roomID].indexOf(user);
    if (index !== -1) {
      roomInfo[roomID].splice(index, 1);
    }

    socket.leave(roomID);    // 退出房间
    // socketIO.to(roomID).emit('sys', user + '退出了房间', roomInfo[roomID]);
    console.log(user + '退出了' + roomID);
  });

  // 接收用户消息,发送相应的房间
  socket.on('message', function (msg) {
    // 验证如果用户不在房间内则不给发送
    if (roomInfo[roomID].indexOf(user) === -1) {  
      return false;
    }
    socketIO.to(roomID).emit('msg', user, msg);
    console.log(roomID + ' --- ' + user + ' --- ' + msg);
  });

});

app.route('/danmu')
.all(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  // res.header('Cache-control', 'no-cache');

  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
})
.get(function (req, res, next) {	
	// console.log(req.query.id);
   	var dan = {
        code: 1,
        danmaku: []
    };
    var sendDan = JSON.stringify(dan);
    // console.log(sendDan);
    res.send(sendDan);
  	// res.send('hello world!');

})
.post(function (req, res, next) {	
	var body = '';
	var jsonStr = {};

	req.on('data', dataListener);
	req.on('end', endListener);

	function dataListener (chunk) {
        body += chunk;
    }

    function endListener () {
        req.removeListener('data', dataListener);
        req.removeListener('end', endListener);

        try {
            jsonStr = JSON.parse(body);
        } catch (err) {
            jsonStr = {};
        }
        console.log(jsonStr.player + ' --- ' + jsonStr.text);
		socketIO.to(jsonStr.player).emit('msg', jsonStr.author, jsonStr);
  		
  		var dan = {
        	code: 1,
        	danmaku: []
    	};
    	dan.danmaku.push(jsonStr);
    	var sendDan = JSON.stringify(dan);
    	res.send(sendDan);
    }
});

server.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
  var uri = 'http://localhost:' + port
  console.log('Listening at ' + uri + '\n')
});
