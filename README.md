# messenger-app-frontend

This is the frontend of my instant messaging app.

- The UI is built in functional React. I chose functional react to develop my understaning of the framework.
- I used [socket.io](socket.io) to leverage the Websocket protocol for instant updates from the backend. For example, to immediately update the UI of User A if User B sends them a message, without having to poll the backend for new messages
- SASS is used for more expressive and understandable stylesheets.

## Installation
**Prerequisites:** Node.js, npm

If you would like to communicate with the BE, follow the installation instructions for [the backend](https://github.com/rowan-dauria/messenger-app-backend)

1. Clone the repo to your local machine.
2. run `npm i` to install the dependency packages.
3. run `npm start` at the root of the repo to start the server that serves the frontend.
4. Visit `localhost:3000` in your browser to view frontend.
