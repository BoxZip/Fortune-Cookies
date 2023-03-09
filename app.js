const express = require('express');
const path = require('path');

const app = express();
const port = 3692;

app.use(express.static(path.join(__dirname, 'www')));

app.listen(port, function(){
    console.log('Nachos Static Server available on port', port)
})