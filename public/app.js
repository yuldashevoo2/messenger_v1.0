// app.js
const socket = io(); // avtomatik /socket.io/socket.io.js orqali

// DOM
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messagesDiv = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const systemDiv = document.getElementById('systemMessages');
const typingDiv = document.getElementById('typing');

let username = localStorage.getItem('username') || null;
let typingTimer = null;

// join agar oldindan username bo'lsa
if (username) {
  usernameInput.value = username;
  doJoin(username);
}

// join tugma
joinBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim() || 'Anon';
  localStorage.setItem('username', name);
  username = name;
  doJoin(name);
});

function doJoin(name) {
  socket.emit('join', name);
  systemDiv.textContent = `Siz bilan: ${name}`;
  usernameInput.disabled = true;
  joinBtn.disabled = true;
  msgInput.focus();
}

// history qabul qilish
socket.on('history', msgs => {
  messagesDiv.innerHTML = '';
  msgs.forEach(addMessageToDom);
  scrollToBottom();
});

// yangi xabar qabul qilish
socket.on('message', msg => {
  addMessageToDom(msg);
  scrollToBottom();
});

// tizim xabarlari
socket.on('system', txt => {
  const el = document.createElement('div');
  el.className = 'system';
  el.textContent = txt;
  systemDiv.appendChild(el);
  setTimeout(()=> el.remove(), 5000);
});

// typing indikator
socket.on('typing', ({ username: who, isTyping }) => {
  if (isTyping) {
    typingDiv.textContent = `${who} yozmoqda...`;
  } else {
    typingDiv.textContent = '';
  }
});

// form yuborish
msgForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  const payload = { username: username || 'Anon', text };
  socket.emit('message', payload);
  msgInput.value = '';
  socket.emit('typing', false);
});

// typing eventi jo'natish (simple)
msgInput.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('typing', false);
  }, 800);
});

function addMessageToDom(msg) {
  const el = document.createElement('div');
  el.className = 'msg';
  if ((msg.username || '') === (username || '')) el.classList.add('me');

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = msg.username + ' · ' + (new Date(msg.time)).toLocaleTimeString();

  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = msg.text;

  el.appendChild(meta);
  el.appendChild(text);
  messagesDiv.appendChild(el);
}

function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
