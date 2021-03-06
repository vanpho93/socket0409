const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.get('/', (req, res) => res.render('home'));
server.listen(3000, () => console.log('Server started!'));

class User {
    constructor(id, username) {
        this.id = id;
        this.username = username;
    }
}

const users = [];

io.on('connection', socket => {

    let currentUsername;
    let currentRoomName;
    socket.on('CLIENT_SEND_MESSSAGE', message => {
        io.emit('SERVER_SEND_MESSSAGE', currentUsername + ': ' + message);
    });

    socket.on('CLIENT_SEND_PRIVATE_MESSSAGE', obj => {
        const { recId, message } = obj;
        // console.log(obj);
        // io.emit('SERVER_SEND_MESSSAGE', currentUsername + ': ' + message);
        socket.to(recId).emit('SERVER_SEND_MESSSAGE', currentUsername + ': ' + message)
        socket.emit('SERVER_SEND_MESSSAGE', currentUsername + ': ' + message)
    });

    socket.on('CLIENT_SEND_ROOM_MESSSAGE', message => {
        io.in(currentRoomName).emit('SERVER_SEND_MESSSAGE', message);
    });

    socket.on('CLIENT_SIGN_IN', username => {
        const isExist = users.some(user => user.username === username);
        if (isExist) return socket.emit('SIGN_IN_CONFIRM', false);
        currentUsername = username;
        socket.emit('SIGN_IN_CONFIRM', true);
        socket.emit('USERS_DATA', users);
        const user = new User(socket.id, username);
        users.push(user);
        io.emit('NEW_USER', user);
    });

    
    socket.on('CLIENT_JOIN_ROOM', roomName => {
        // if (!currentRoomName) {
            //     return socket.leave(currentRoomName, () => {
            //         socket.join(roomName);
            //     });
            // }
        // socket.join(roomName);
        if (!currentRoomName) {
            socket.join(roomName);
            return currentRoomName = roomName;
        }
        socket.leave(currentRoomName, () => {
            socket.join(roomName, () => currentRoomName = roomName);
        });
    });

    socket.on('disconnect', () => {
        const index = users.findIndex(user => user.id === socket.id);
        if (index === -1) return;
        io.emit('USER_DISCONNECT', users[index]);
        users.splice(index, 1);
    });
});

require('reload')(app);

// 1. Khi dang nhap thanh cong, gui ve users -> Client show ra
// 2. Khi co nguoi dang ky moi, thong bao cho tat ca
