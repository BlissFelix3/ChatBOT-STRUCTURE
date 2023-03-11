const express = require("express");
const expressWs = require("express-ws");
const app = express();
const port = 3000;

const fastFoods = {
  2: "Item1",
  3: "Item2",
  4: "Item3",
  5: "Item4",
};

const orderHistory = [];

expressWs(app);

app.use(express.static("public"));

app.ws("/", (ws, req) => {
  console.log("User connected:", ws._socket.remoteAddress);

  // Ask for the user's name
  ws.send(
    JSON.stringify({ type: "bot-message", message: "Hello! What's your name?" })
  );

  const currentOrder = [];

  let userName = "";

  // Listen for incoming messages
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    console.log("Message received:", data);

    if (!userName) {
      // Save the user's name and update the welcome message
      userName = data.message;
      ws.send(
        JSON.stringify({
          type: "bot-message",
          message: `Welcome to the Fast Food ChatBot, ${userName}! Place an order\n1. Typehere\n99. Typehere\n98. Typehere\n97. Typehere\n0. Cancel order`,
        })
      );
    } else {
      switch (data.message) {
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
          const selectedIndex = parseInt(data.message);
          if (fastFoods.hasOwnProperty(selectedIndex)) {
            const selectedItem = fastFoods[selectedIndex];
            currentOrder.push(selectedItem);
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
          if (currentOrder.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No order to place. Place an order\n1. See menu",
              })
            );
          } else {
            orderHistory.push(currentOrder);
            ws.send(
              JSON.stringify({ type: "bot-message", message: "Order placed" })
            );
            currentOrder.length = 0;
          }
          break;
        case "98":
          if (orderHistory.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No previous orders",
              })
            );
          } else {
            const orderHistoryString = orderHistory
              .map((order, index) => `Order ${index + 1}: ${order.join(", ")}`)
              .join("\n");
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: `Here is your order history:\n ${orderHistoryString}`,
              })
            );
          }
          break;
        case "97":
          if (currentOrder.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No items in the current order.",
              })
            );
          } else {
            const currentOrderString = currentOrder.join(", ");
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: `Here are the items in your current order:\n ${currentOrderString}`,
              })
            );
          }
          break;
        case "0":
          if (currentOrder.length === 0) {
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "No order to cancel.",
              })
            );
          } else {
            currentOrder.length = 0;
            ws.send(
              JSON.stringify({
                type: "bot-message",
                message: "Current order cancelled.",
              })
            );
          }
          break;
        default:
          ws.send(
            JSON.stringify({
              type: "bot-message",
              message: "Invalid selection.",
            })
          );
          break;
      }
    }
  });

  ws.on("close", () => {
    console.log("User disconnected:", ws._socket.remoteAddress);
  });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
