'use strict';

const Client = require('./model/client');
const net = require('net');
const EE = require('events').EventEmitter;
const ee = new EE();
const server = net.createServer();
const PORT = process.env.PORT || 8888;

const pool = [];

ee.on('default', (client, string) => {
  client.socket.write(`Not a valid command: ${string.split(' ', 1)}\n`);
});

ee.on('@all', (client, string) => {
  pool.forEach(c => c.socket.write(`${client.nickName}: ${string}`));
});

server.on('connection', socket => {
  let client = new Client(socket);
  pool.push(client);
  pool.forEach(c => c.socket.write(`${client.userName} has joined you\n`));

  socket.on('data', data => {
    let command = data.toString().split(' ').shift().trim();
    if(command.startsWith('@')) {
      ee.emit(command, client, data.toString().split(' ').slice(1).join(' '));
      return;
    }
    ee.emit('default', client, data.toString());
  });
});

ee.on('@nick', (client, newNick) => {
  client.nickName = newNick.trim();
  client.socket.write(`Name changed to ${client.nickName}\n`);
});

ee.on('@dm', (client, string) => {
  let targetUser = pool.find(target => {
    return target.nickName === string.split(' ').shift().trim();
  });
  let message = `${string.split(' ').slice(1).join()}`;
  if (targetUser) {
    client.socket.write(`To ${targetUser.nickName}: ${message}`);
    targetUser.socket.write(`From ${client.nickName}: ${message}`);
  }
});

server.listen(PORT, () => console.log(`Listening in on port ${PORT}`));
