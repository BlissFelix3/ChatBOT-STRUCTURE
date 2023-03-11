const express = require("express");
const app = express();

const session = require("express-session");
const expressWs = require("express-ws")(app);

// Use session middleware
const sessionMiddleware = session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
});
app.use(sessionMiddleware);

// Serve static files from the public directory
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const fastFoods = {
  2: "Item1",
  3: "Item2",
  4: "Item3",
  5: "Item4",
};

const orderHistory = [];

app.ws("/", (ws, req) => {
  console.log("User connected");

  // Ask for the user's name
  ws.send(
    JSON.stringify({ type: "bot-message", message: "Hello! What's your name?" })
  );

  req.session.currentOrder = [];

  let userName = "";

  // Listen for incoming messages
  ws.on("message", (message) => {
    console.log("Message received:", message);

    const { type, data } = JSON.parse(message);

    if (!userName) {
      // Save the user's name and update the welcome message
      userName = data;
      ws.send(
        JSON.stringify({
          type: "bot-message",
          message: `Welcome to the Fast Food ChatBot, ${userName}! Place an order\n1. typehere\n99. Typehere\n98. Typehere\n97. Typehere\n0. Cancel order`,
        })
      );
    } else {
      switch (data) {
        case "1":
          // Generate the list of items dynamically
          const itemOptions = Object.keys(fastFoods)
            .map((key) => `${key}. ${fastFoods[key]}`)
            .join("\n");
          ws.send(
            JSON.stringify({
              type: "bot-message",
              message: `Here is a list of items you can order:\n ${itemOptions} \nPlease select one by typing its number.`,
            })
          );
          break;
        case "2":
        case "3":
        case "4":
        case "5":
          // Parse the number from the user input and add the corresponding item to the current order
          const selectedIndex = parseInt(data);
          if (fastFoods.hasOwnProperty(selectedIndex)) {
            const selectedItem = fastFoods[selectedIndex];
            req.session.currentOrder.push(selectedItem);
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: `${selectedItem} has been added to your order. Do you want to add more items to your order? Type numbers. If not, type 99 to checkout.`,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "Invalid selection.",
              })
            );
          }
          break;
        case "99":
          if (req.session.currentOrder.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No order to place. Place an order\n1. See menu",
              })
            );
          } else {
            orderHistory.push(req.session.currentOrder);
            ws.send(
              JSON.stringify({ type: "bot-message", message: "Order placed" })
            );
            req.session.currentOrder = [];
          }
          break;
        case "98":
          if (orderHistory.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No order history.",
              })
            );
          } else {
            const orderHistoryString = orderHistory
              .map((order, index) => {
                return `Order ${index + 1}: ${order.join(", ")}`;
              })
              .join("\n");
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: `Here is your order history:\n${orderHistoryString}`,
              })
            );
          }
          break;
        case "97":
          if (req.session.currentOrder.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No current order.",
              })
            );
          } else {
            const currentOrderString = req.session.currentOrder.join(", ");
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: `Here is your current order:\n${currentOrderString}`,
              })
            );
          }
          break;
        case "0":
          req.session.currentOrder = [];
          ws.send(
            JSON.stringify({ type: "bot-message", message: "Order cancelled." })
          );
          break;
        default:
          ws.send(
            JSON.stringify({ type: "bot-message", message: "Invalid input." })
          );
          break;
      }
    }
  });

  ws.on("close", () => {
    console.log("User disconnected");
  });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
