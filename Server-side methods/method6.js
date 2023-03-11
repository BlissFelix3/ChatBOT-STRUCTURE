// Import dependencies
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");

// Set up the server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static("public"));

// Use session middleware
const sessionMiddleware = session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
});
app.use(sessionMiddleware);
io.use((socket, next) =>
  sessionMiddleware(socket.request, socket.request.res, next)
);

// Define the fast foods and order history
const fastFoods = {
  2: "Item1",
  3: "Item2",
  4: "Item3",
  5: "Item4",
};
const orderHistory = [];

// Define the socket.io event listeners
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Define the bot message function
  const sendBotMessage = (message) => {
    console.log("Bot message received:", message);
    socket.emit("bot-message", message);
  };

  // Ask for the user's name
  sendBotMessage("Hello! What's your name?");

  // Define the current order
  socket.request.session.currentOrder = [];

  // Define the user name
  let userName = "";

  // Listen for incoming user messages
  socket.on("user-message", (message) => {
    console.log("User message received:", message);

    if (!userName) {
      // Save the user's name and update the welcome message
      userName = message;
      sendBotMessage(
        `Welcome to the ChatBot, ${userName}! Place an order\n1. Typehere\n99. Typehere\n98. Typehere\n97. Typehere\n0. Cancel order`
      );
    } else {
      switch (message) {
        case "1":
          // Generate the list of items dynamically
          const itemOptions = Object.keys(fastFoods)
            .map((key) => `${key}. ${fastFoods[key]}`)
            .join("\n");
          sendBotMessage(
            `Here is a list of items you can order:\n ${itemOptions} \nPlease select one by typing its number.`
          );
          break;
        case "2":
        case "3":
        case "4":
        case "5":
          // Parse the number from the user input and add the corresponding item to the current order
          const selectedIndex = parseInt(message);
          if (fastFoods.hasOwnProperty(selectedIndex)) {
            const selectedItem = fastFoods[selectedIndex];
            socket.request.session.currentOrder.push(selectedItem);
            sendBotMessage(
              `${selectedItem} has been added to your order. Do you want to add more items to your order? Type numbers. If not, type 99 to checkout.`
            );
          } else {
            sendBotMessage("Invalid selection.");
          }
          break;
        case "99":
          if (socket.request.session.currentOrder.length === 0) {
            sendBotMessage("No order to place. Place an order\n1. See menu");
          } else {
            orderHistory.push(socket.request.session.currentOrder);
            sendBotMessage("Order placed");
            socket.request.session.currentOrder = [];
          }
          break;
        case "98":
          if (orderHistory.length === 0) {
            sendBotMessage("No previous orders");
          } else {
            const orderHistoryString = orderHistory
              .map((order, index) => `Order ${index + 1}: ${order.join(", ")}`)
              .join("\n");
            socket.emit(
              "bot-message",
              `Here is your order history:\n ${orderHistoryString}`
            );
          }
          break;

        case "97":
          if (socket.request.session.currentOrder.length === 0) {
            sendBotMessage("No current order. Place an order\n1. See menu");
          } else {
            const currentOrderString =
              socket.request.session.currentOrder.join(", ");
            sendBotMessage(`Here is your current order: ${currentOrderString}`);
          }
          break;
        case "0":
          socket.request.session.currentOrder = [];
          sendBotMessage("Order cancelled. Place a new order\n1. See menu");
          break;
        default:
          sendBotMessage("Invalid selection. Please try again.");
          break;
      }
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
