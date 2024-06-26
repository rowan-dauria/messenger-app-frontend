async function login(email, password) {
  const bodyJSON = { email, password };
  const res = await fetch('/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyJSON),
  });
  const json = await res.json();
  return json;
}

async function postNewUser(displayName, email, password) {
  const bodyJSON = { displayName, email, password };
  const res = await fetch('/new-user', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyJSON),
  });
  const json = await res.json();
  return json;
}

async function fetchChats() {
  const res = await fetch('auth/chats');
  if (res.status !== 200) throw new Error('Error fetching chats');
  const chats = await res.json();
  return chats;
}

async function fetchUsers() {
  const res = await fetch('auth/users');
  if (res.status !== 200) throw new Error('Error fetching chats');
  const users = await res.json();
  return users;
}

async function fetchMsgsByChatID(id) {
  const res = await fetch(`auth/messages?chat_id=${id}`);
  const chat = await res.json();
  return chat;
}

async function fetchMyUser() {
  const res = await fetch('auth/users/me');
  return res;
}

async function postJSON(endpoint, JSONData) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSONData),
  });
  const json = await res.json();
  return json;
}

export default {
  login,
  postNewUser,
  fetchChats,
  fetchUsers,
  fetchMsgsByChatID,
  fetchMyUser,
  postJSON,
};
