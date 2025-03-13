const firebaseConfig = {
  apiKey: "AIzaSyD5X9VwkILBgMp76NUxOonRMuGAczBdXMU",
  authDomain: "swaad-qr.firebaseapp.com",
  projectId: "swaad-qr",
  storageBucket: "swaad-qr.appspot.com",
  messagingSenderId: "330570799980",
  appId: "1:330570799980:web:e0486d5a560ec64bd3b149",
  measurementId: "G-KC4P9YWCC1",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const tableButtons = document.getElementById("tableButtons");
const tableIndicator = document.getElementById("tableIndicator");
const menuItems = document.getElementById("menuItems");
const orderItems = document.getElementById("orderItems");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const generateBillBtn = document.getElementById("generateBillBtn");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const scanQrBtn = document.getElementById("scanQrBtn");
const scannerContainer = document.getElementById("scannerContainer");
const video = document.getElementById("scanner");
const cameraToggle = document.getElementById("cameraToggle");

// Application State
let currentTable = "1";
let allMenuItems = [];
let tableOrders = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
};
let scanning = false;
let stream = null;

// Initialize the application
init();

function init() {
  loadMenuItems();
  setupEventListeners();
  updateOrderDisplay();
}

function setupEventListeners() {
  // Table selection
  tableButtons.addEventListener("click", (e) => {
    if (e.target.classList.contains("table-btn")) {
      const tableNum = e.target.dataset.table;
      switchTable(tableNum);
    }
  });

  // Search functionality
  searchBtn.addEventListener("click", searchMenuItems);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      searchMenuItems();
    }
  });

  // Order buttons
  generateBillBtn.addEventListener("click", generateBill);
  clearOrderBtn.addEventListener("click", clearCurrentOrder);

  // QR scanning
  scanQrBtn.addEventListener("click", toggleScanner);
  cameraToggle.addEventListener("click", toggleScanner);
}

// Load menu items from Firebase
function loadMenuItems() {
  db.collection("menuItems")
    .get()
    .then((querySnapshot) => {
      allMenuItems = [];
      querySnapshot.forEach((doc) => {
        const item = {
          id: doc.id,
          ...doc.data(),
        };
        allMenuItems.push(item);
      });

      displayMenuItems(allMenuItems);
    })
    .catch((error) => {
      console.error("Error loading menu items: ", error);
      menuItems.innerHTML = `
            <div class="no-items">Error loading menu items. Please try again.</div>
          `;
    });
}

// Display menu items in the UI
function displayMenuItems(items) {
  if (items.length === 0) {
    menuItems.innerHTML = `
          <div class="no-items">No menu items found</div>
        `;
    return;
  }

  let html = "";
  items.forEach((item) => {
    html += `
          <div class="menu-item">
            <div class="menu-item-details">
              <div class="menu-item-name">
                ${item.name}
                <span class="veg-indicator ${
                  item.isVeg ? "veg" : "non-veg"
                }"></span>
              </div>
              <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
            </div>
            <button class="add-item-btn" data-id="${item.id}">Add</button>
          </div>
        `;
  });

  menuItems.innerHTML = html;

  // Add event listeners to Add buttons
  document.querySelectorAll(".add-item-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.id;
      const item = allMenuItems.find((item) => item.id === itemId);
      addItemToOrder(item);
    });
  });
}

// Search menu items
function searchMenuItems() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  if (searchTerm === "") {
    displayMenuItems(allMenuItems);
    return;
  }

  const filteredItems = allMenuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm)
  );

  displayMenuItems(filteredItems);
}

// Switch between tables
function switchTable(tableNum) {
  currentTable = tableNum;

  // Update UI
  document.querySelectorAll(".table-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.table-btn[data-table="${tableNum}"]`)
    .classList.add("active");
  tableIndicator.textContent = `Table ${tableNum}`;

  // Update order display
  updateOrderDisplay();
}

// Add item to current table's order
function addItemToOrder(item) {
  const currentOrder = tableOrders[currentTable];

  // Check if item already exists in order
  const existingItemIndex = currentOrder.findIndex(
    (orderItem) => orderItem.id === item.id
  );

  if (existingItemIndex !== -1) {
    // Increment quantity
    currentOrder[existingItemIndex].quantity += 1;
  } else {
    // Add new item
    currentOrder.push({
      id: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      quantity: 1,
    });
  }

  updateOrderDisplay();
}

// Update the order display
function updateOrderDisplay() {
  const currentOrder = tableOrders[currentTable];

  if (currentOrder.length === 0) {
    orderItems.innerHTML = `
          <div class="no-items">No items added to this order yet</div>
        `;
    subtotalElement.textContent = "₹0.00";
    taxElement.textContent = "₹0.00";
    totalElement.textContent = "₹0.00";
    return;
  }

  let html = "";
  let subtotal = 0;

  currentOrder.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    html += `
          <div class="order-item">
            <div class="order-item-details">
              <div class="order-item-name">
                ${item.name}
                <span class="veg-indicator ${
                  item.isVeg ? "veg" : "non-veg"
                }"></span>
              </div>
              <div class="order-item-price">₹${item.price.toFixed(2)} × ${
      item.quantity
    } = ₹${itemTotal.toFixed(2)}</div>
            </div>
            <div class="quantity-controls">
              <button class="qty-btn decrease-btn" data-index="${index}">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn increase-btn" data-index="${index}">+</button>
              <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `;
  });

  orderItems.innerHTML = html;

  // Calculate totals
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
  taxElement.textContent = `₹${tax.toFixed(2)}`;
  totalElement.textContent = `₹${total.toFixed(2)}`;

  // Add event listeners to quantity buttons
  document.querySelectorAll(".decrease-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      decreaseQuantity(index);
    });
  });

  document.querySelectorAll(".increase-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      increaseQuantity(index);
    });
  });

  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      removeItem(index);
    });
  });
}

// Decrease item quantity
function decreaseQuantity(index) {
  const currentOrder = tableOrders[currentTable];

  if (currentOrder[index].quantity > 1) {
    currentOrder[index].quantity -= 1;
  } else {
    removeItem(index);
    return;
  }

  updateOrderDisplay();
}

// Increase item quantity
function increaseQuantity(index) {
  const currentOrder = tableOrders[currentTable];
  currentOrder[index].quantity += 1;
  updateOrderDisplay();
}

// Remove item from order
function removeItem(index) {
  const currentOrder = tableOrders[currentTable];
  currentOrder.splice(index, 1);
  updateOrderDisplay();
}

// Clear current order
function clearCurrentOrder() {
  if (confirm("Are you sure you want to clear this order?")) {
    tableOrders[currentTable] = [];
    updateOrderDisplay();
  }
}

// Generate bill
function generateBill() {
  const currentOrder = tableOrders[currentTable];

  if (currentOrder.length === 0) {
    alert("No items in the current order");
    return;
  }

  // Calculate totals
  let subtotal = 0;
  currentOrder.forEach((item) => {
    subtotal += item.price * item.quantity;
  });

  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  // Create a printable bill
  const now = new Date();
  const billDate = now.toLocaleDateString();
  const billTime = now.toLocaleTimeString();

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - Table ${currentTable}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }       
                .restaurant-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .bill-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                
                .bill-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                
                .bill-table th {
                    border-bottom: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                
                .bill-table td {
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                }
                
                .bill-table .amount {
                    text-align: right;
                }
                
                .total-section {
                    border-top: 1px solid #ddd;
                    margin-top: 10px;
                    padding-top: 10px;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                
                .grand-total {
                    font-weight: bold;
                    font-size: 18px;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                }
                
                .veg-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    margin-right: 5px;
                    border: 1px solid;
                    border-radius: 2px;
                }
                
                .veg {
                    border-color: green;
                }
                
                .veg::after {
                    content: '';
                    display: block;
                    width: 6px;
                    height: 6px;
                    margin: 1px;
                    border-radius: 50%;
                    background-color: green;
                }
                
                .non-veg {
                    border-color: red;
                }
                
                .non-veg::after {
                    content: '';
                    display: block;
                    width: 6px;
                    height: 6px;
                    margin: 1px;
                    border-radius: 50%;
                    background-color: red;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="restaurant-name">Restaurant Name</div>
                <div>123 Main Street, City</div>
                <div>Phone: (123) 456-7890</div>
            </div>
            
            <div class="bill-info">
                <div>
                    <div><strong>Table:</strong> ${currentTable}</div>
                    <div><strong>Bill #:</strong> T${currentTable}-${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}</div>
                </div>
                <div>
                    <div><strong>Date:</strong> ${billDate}</div>
                    <div><strong>Time:</strong> ${billTime}</div>
                </div>
            </div>
            
            <table class="bill-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentOrder
                      .map(
                        (item) => `
                        <tr>
                            <td>
                                <span class="veg-indicator ${
                                  item.isVeg ? "veg" : "non-veg"
                                }"></span>
                                ${item.name}
                            </td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">₹${(
                              item.price * item.quantity
                            ).toFixed(2)}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>GST (5%):</span>
                    <span>₹${tax.toFixed(2)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Total Amount:</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for dining with us!</p>
                <p>Visit us again soon</p>
            </div>
        </body>
        </html>
        `);

  // Ensure the content is loaded before printing
  printWindow.onload = function () {
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };

  // Send bill to WhatsApp
  sendBillToWhatsApp(currentOrder, subtotal, tax, total, currentTable);
}

// Function to send bill to WhatsApp
function sendBillToWhatsApp(order, subtotal, tax, total, tableNumber) {
  // Prepare the bill message
  let billMessage = `*Bill for Table ${tableNumber}*\n\n`;
  billMessage += "--------------------------------\n";

  order.forEach((item) => {
    billMessage += `${item.name} - ₹${item.price.toFixed(2)} × ${
      item.quantity
    } = ₹${(item.price * item.quantity).toFixed(2)}\n`;
  });

  billMessage += "--------------------------------\n";
  billMessage += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
  billMessage += `GST (18%): ₹${tax.toFixed(2)}\n`;
  billMessage += `*Total Amount: ₹${total.toFixed(2)}*\n\n`;
  billMessage += "Thank you for dining with us! 🍽️";

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(billMessage);

  // Replace with your restaurant's WhatsApp number
  const whatsappNumber = "911234567890"; // Example: 91 for India, followed by the number

  // Create the WhatsApp URL
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  // Open the WhatsApp link in a new tab
  window.open(whatsappUrl, "_blank");
}

// QR Code Scanner
async function toggleScanner() {
  if (scanning) {
    stopScanner();
  } else {
    startScanner();
  }
}

async function startScanner() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    video.srcObject = stream;
    scannerContainer.classList.remove("hidden");
    scanQrBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Scan';
    scanning = true;

    // Start scanning for QR codes
    requestAnimationFrame(scanQRCode);
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert("Could not access camera. Please check permissions and try again.");
  }
}

function stopScanner() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    stream = null;
  }

  scannerContainer.classList.add("hidden");
  scanQrBtn.innerHTML = '<i class="fas fa-qrcode"></i> Scan QR Code';
  scanning = false;
}

function scanQRCode() {
  if (!scanning) return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      // QR code detected
      handleQRCode(code.data);
      stopScanner();
      return;
    }
  }

  // Continue scanning if no QR code found
  requestAnimationFrame(scanQRCode);
}

function handleQRCode(data) {
  try {
    // Parse the QR code data (assuming it's in JSON format)
    const qrData = JSON.parse(data);

    // Check if the QR code contains order data
    if (qrData.type === "order") {
      // Clear the current order for the selected table
      tableOrders[currentTable] = [];

      // Add items from the QR code to the current table's order
      qrData.items.forEach((item) => {
        const menuItem = allMenuItems.find((menuItem) => menuItem.id === item.id);
        if (menuItem) {
          // Add the item to the order with the correct quantity
          tableOrders[currentTable].push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            isVeg: menuItem.isVeg,
            quantity: item.quantity,
          });
        }
      });

      // Update the order display
      updateOrderDisplay();

      // Notify the waiter
      alert(`Order from QR code has been added to Table ${currentTable}.`);
    } else {
      alert("Invalid QR code format. Please scan a valid order QR code.");
    }
  } catch (error) {
    console.error("Error processing QR code:", error);
    alert("Invalid QR code format. Please scan a valid order QR code.");
  }
}
