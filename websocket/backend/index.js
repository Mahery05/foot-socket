import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
app.use(cors());

// Définir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.room && rooms[socket.room]) {
            delete rooms[socket.room].players[socket.id];
            io.to(socket.room).emit('playerUpdate', rooms[socket.room].players);
        }
    });

    socket.on('join', (room) => {
        socket.leave(socket.room);
        socket.join(room);
        socket.room = room;

        if (!rooms[room]) {
            rooms[room] = {
                players: {},
                ball: { x: 400, y: 300 }
            };
        }

        rooms[room].players[socket.id] = {
            x: Math.floor(Math.random() * 800),
            y: Math.floor(Math.random() * 600)
        };

        io.to(room).emit('playerUpdate', rooms[room].players);
        io.to(room).emit('ballUpdate', rooms[room].ball);
    });

    socket.on('leave', (room) => {
        socket.leave(room);
        if (rooms[room]) {
            delete rooms[room].players[socket.id];
            io.to(room).emit('playerUpdate', rooms[room].players);
        }
    });

    socket.on('playerMove', (data) => {
        const room = socket.room;
        if (rooms[room] && rooms[room].players[socket.id]) {
            rooms[room].players[socket.id].x = data.x;
            rooms[room].players[socket.id].y = data.y;
            io.to(room).emit('playerUpdate', rooms[room].players);
        }
    });

    socket.on('ballMove', (data) => {
        const room = socket.room;
        if (rooms[room]) {
            rooms[room].ball = data;
            io.to(room).emit('ballUpdate', rooms[room].ball);
        }
    });
});

server.listen(PORT, () => {
    console.log('Server running at http://' + ip.address() + ':' + PORT);
});
