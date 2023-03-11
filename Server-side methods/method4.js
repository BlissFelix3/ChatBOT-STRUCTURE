const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const session = require("express-session");
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

io.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let userName = "";
  socket.session = socket.request.session;

  socket.emit("bot-message", "Hello! What's your name?");

  socket.on("user-message", (message) => {
    console.log("User message received:", message);

    if (!userName) {
      userName = message;
      socket.emit(
        "bot-message",
        `Welcome to the ChatBot, ${userName}! Place an order\n1. Typehere\n99. Typehere\n98. Typehere\n97. Typehere\n0. Cancel order`
      );
    } else {
      switch (message) {
        case "1":
          const itemOptions = Object.entries(fastFoods)
            .map(([key, value]) => `${key}. ${value}`)
            .join("\n");
          socket.emit(
            "bot-message",
            `Here is a list of items you can order:\n${itemOptions}\nPlease select one by typing its number.`
          );
          break;
        case "2":
        case "3":
        case "4":
        case "5":
          const selectedIndex = parseInt(message);
          if (fastFoods.hasOwnProperty(selectedIndex)) {
            const selectedItem = fastFoods[selectedIndex];
            socket.session.currentOrder = socket.session.currentOrder || [];
            socket.session.currentOrder.push(selectedItem);
            socket.emit(
              "bot-message",
              `${selectedItem} has been added to your order. Do you want to add more items to your order? Type numbers. If not, type 99 to checkout.`
            );
          } else {
            socket.emit("bot-message", "Invalid selection.");
          }
          break;
        case "99":
          if (
            socket.session.currentOrder &&
            socket.session.currentOrder.length
          ) {
            orderHistory.push(socket.session.currentOrder);
            socket.emit("bot-message", "Order placed");
            delete socket.session.currentOrder;
          } else {
            socket.emit(
              "bot-message",
              "No order to place. Place an order\n1. See menu"
            );
          }
          break;
        case "98":
          if (orderHistory.length) {
            const orderHistoryString = orderHistory
              .map((order, index) => `Order ${index + 1}: ${order.join(", ")}`)
              .join("\n");
            socket.emit(
              "bot-message",
              `Here is your order history:\n${orderHistoryString}`
            );
          } else {
            socket.emit("bot-message", "No previous orders");
          }
          break;
        case "97":
          if (
            socket.session.currentOrder &&
            socket.session.currentOrder.length
          ) {
            socket.emit(
              "bot-message",
              `Here is your current order: ${socket.session.currentOrder.join(
                ", "
              )}

              Type 99 to checkout your order or 0 to cancel.`
            );
          } else {
            socket.emit(
              "bot-message",
              "No current order. Place an order\n1. See menu"
            );
          }
          break;
        case "0":
          if (
            socket.session.currentOrder &&
            socket.session.currentOrder.length
          ) {
            socket.emit("bot-message", "Order cancelled");
            delete socket.session.currentOrder;
          } else {
            socket.emit(
              "bot-message",
              "No current order to cancel. Place an order\n1. See menu"
            );
          }
          break;
        default:
          socket.emit("bot-message", "Invalid selection.");
          break;
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
