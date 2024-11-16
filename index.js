import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import cors from 'cors';

const port = process.env.PORT || 3001; // FIX: Use process.env.PORT instead of process.env.port
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

// Load the JSON data
try {
    const filePath = 'recipe.json';
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        jsonData = JSON.parse(data);
        console.log('JSON data loaded successfully');
    } else {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }
} catch (error) {
    console.error('Error reading the JSON file:', error);
    process.exit(1);
}

// Socket.io connection
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

// Helper function to find the answer
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

// Start the server
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
