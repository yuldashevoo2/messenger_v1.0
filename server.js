// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// statik fayllarni server qilish
app.use(express.static(path.join(__dirname, 'public')));

// oddiy in-memory message history (demo uchun)
const MAX_HISTORY = 200;
const messages = []; // har xabar: {id, username, text, time}

io.on('connection', socket => {
  console.log('Yangi mijoz ulandi:', socket.id);

  // history yuborish
  socket.emit('history', messages);

  // foydalanuvchi join qilganda (optional)
  socket.on('join', username => {
    socket.username = username || 'Anon';
    console.log(`${socket.username} qo'shildi`);
    socket.broadcast.emit('system', `${socket.username} chatga qo'shildi`);
  });

  // yangi xabar
  socket.on('message', payload => {
    // payload: {username, text}
    const msg = {
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      username: payload.username || socket.username || 'Anon',
      text: payload.text,
      time: new Date().toISOString()
    };
    // history saqlash
    messages.push(msg);
    if (messages.length > MAX_HISTORY) messages.shift();

    // barcha mijozlarga uzatish
    io.emit('message', msg);
  });

  // typing indicator
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', { username: socket.username || 'Anon', isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Ulanish uzildi:', socket.id);
    if (socket.username) {
      socket.broadcast.emit('system', `${socket.username} chatdan chiqdi`);
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.json({ success: false, message: "Telefon raqam kiritilmadi ❌" });

  // vaqtinchalik user saqlash (keyinchalik DB ga o‘tkazamiz)
  return res.json({ success: true, message: "Xush kelibsiz ✅" });
});


// server ishga tushishi
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ${PORT}-portda ishlayapti`));
