let room = '';
const roomArea = document.querySelector('#room');
const gameArea = document.getElementById('gameArea');
const ballElement = document.getElementById('ball');
const socket = io('http://localhost:3000');

let players = {};
let ball = { x: 400, y: 300 };

socket.on('connect', () => {
    console.log('Connected');
});

socket.on('playerUpdate', (data) => {
    players = data;
    updatePlayers();
});

socket.on('ballUpdate', (data) => {
    ball = data;
    ballElement.style.left = `${ball.x}px`;
    ballElement.style.top = `${ball.y}px`;
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

function updatePlayers() {
    document.querySelectorAll('.player').forEach(el => el.remove());
    Object.keys(players).forEach(id => {
        const player = document.createElement('div');
        player.className = 'player';
        player.style.left = `${players[id].x}px`;
        player.style.top = `${players[id].y}px`;
        gameArea.appendChild(player);
    });
}

document.addEventListener('keydown', (event) => {
    const player = players[socket.id];
    if (!player) return;

    switch (event.key) {
        case 'ArrowUp':
            player.y -= 5;
            break;
        case 'ArrowDown':
            player.y += 5;
            break;
        case 'ArrowLeft':
            player.x -= 5;
            break;
        case 'ArrowRight':
            player.x += 5;
            break;
    }

    socket.emit('playerMove', player);
});

gameArea.addEventListener('click', (event) => {
    const rect = gameArea.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ball.x = x;
    ball.y = y;
    socket.emit('ballMove', ball);
});

roomArea.addEventListener('change', (e) => {
    socket.emit('leave', room);
    socket.emit('join', e.target.value);
    room = e.target.value;
});
