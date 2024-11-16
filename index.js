import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import cors from 'cors';

const port = process.env.port || 3001;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.static('public'));

let smartAnswer;
let jsonData;

try {
    const filePath = 'recipe.json';
    const data = fs.readFileSync(filePath, 'utf8');
    jsonData = JSON.parse(data);
    console.log('JSON data loaded successfully');
} catch (error) {
    console.error('Error reading the file:', error);
    process.exit(1);
}

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('client message', (msg) => {
        console.log('Message received from client:', msg);
        smartAnswer = findAnswer(msg);
        socket.emit('bot-message', smartAnswer);
        console.log('Bot response:', smartAnswer);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

function findAnswer(query) {
    const lowerCaseQuery = query.toLowerCase();

    // Check for greetings
    for (const keyword of jsonData["greeting"].keywords) {
        if (lowerCaseQuery.includes(keyword)) {
            return jsonData["greeting"].response;
        }
    }

    // Check for farewells
    for (const keyword of jsonData["farewell"].keywords) {
        if (lowerCaseQuery.includes(keyword)) {
            return jsonData["farewell"].response;
        }
    }

    // Check for recipe keywords
    for (const recipe of jsonData["provideRecipe"].responses) {
        if (lowerCaseQuery.includes(recipe.keyword)) {
            return `${recipe.response}\nIngredients:\n${recipe.ingredients}\nFor more instructions, visit: ${recipe.link}`;
        }
    }

    // Fallback response
    return jsonData["fallback"].response;
}

server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
