const express = require('express');
// require('dotenv').config();
// const { Groq } = require('groq-sdk');

const app = express();
const PORT = 4005;

app.get('/', (req, res) => res.send('Hello'));

const server = app.listen(PORT, () => {
    console.log(`Test Server running on ${PORT}`);
});

process.on('exit', (code) => console.log('Exit:', code));
