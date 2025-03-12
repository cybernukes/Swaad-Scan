// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5X9VwkILBgMp76NUxOonRMuGAczBdXMU",
  authDomain: "swaad-qr.firebaseapp.com",
  projectId: "swaad-qr",
  storageBucket: "swaad-qr.firebasestorage.app",
  messagingSenderId: "330570799980",
  appId: "1:330570799980:web:e0486d5a560ec64bd3b149",
  measurementId: "G-KC4P9YWCC1",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const menuCollection = db.collection("menuItems");
const categoryCollection = db.collection("categories");

// Global variables
let currentCategory = "all";
let allMenuItems = [];
let categories = [];
let filteredItems = [];
let isSearchActive = false;

// Function to load categories
function loadCategories() {
  return categoryCollection
    .get()
    .then((querySnapshot) => {
      const categoryList = [];

      querySnapshot.forEach((doc) => {
        categoryList.push({
          id: doc.id,
          name: doc.data().name,
        });
      });

      // If no categories found, add default ones
      if (categoryList.length === 0) {
        return addDefaultCategories().then(() => loadCategories());
      }

      return categoryList;
    })
    .catch((error) => {
      console.error("Error loading categories: ", error);
      return [];
    });
}

// Function to add default categories
function addDefaultCategories() {
  const batch = db.batch();
  const defaultCategories = [
    { name: "Main Course" },
    { name: "Starters" },
    { name: "Desserts" },
    { name: "Beverages" },
  ];

  defaultCategories.forEach((category) => {
    const newCategoryRef = categoryCollection.doc();
    batch.set(newCategoryRef, category);
  });

  return batch
    .commit()
    .then(() => {
      console.log("Default categories added");
    })
    .catch((error) => {
      console.error("Error adding default categories: ", error);
    });
}

// Function to update category tabs
function updateCategoryTabs(categoriesList) {
  categories = categoriesList;
  const tabsContainer = document.getElementById("category-tabs");
  const categorySelect = document.getElementById("item-category");

  // Clear existing tabs except "All Items"
  tabsContainer.innerHTML =
    '<button class="nav-tab active" data-category="all">All Items</button>';

  // Clear and re-add options to the category select
  categorySelect.innerHTML = '<option value="">Select Category</option>';

  categoriesList.forEach((category) => {
    // Add tab
    const tab = document.createElement("button");
    tab.classList.add("nav-tab");
    tab.setAttribute("data-category", category.id);
    tab.textContent = category.name;
    tab.onclick = () => filterMenuByCategory(category.id);
    tabsContainer.appendChild(tab);

    // Add option to select
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// Function to load menu items
function loadMenu() {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = '<div class="loader"></div>';

  return menuCollection
    .get()
    .then((querySnapshot) => {
      allMenuItems = [];
      menuList.innerHTML = "";

      if (querySnapshot.empty) {
        // Add demo items if no items exist
        return addDemoItems().then(() => loadMenu());
      }

      // Store all items
      querySnapshot.forEach((doc) => {
        allMenuItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Display items based on current category
      displayMenuItems();
      return allMenuItems;
    })
    .catch((error) => {
      console.error("Error loading menu: ", error);
      menuList.innerHTML = `
                        <div class="empty-state">
                            <h3>Error Loading Menu</h3>
                            <p>There was a problem connecting to the database.</p>
                        </div>
                    `;
      return [];
    });
}

// Function to filter menu by category
function filterMenuByCategory(categoryId) {
  // Update active tab
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
    if (tab.getAttribute("data-category") === categoryId) {
      tab.classList.add("active");
    }
  });

  currentCategory = categoryId;
  displayMenuItems();
}

function searchMenu(event) {
  // If Enter key pressed or button clicked
  if (event && event.key && event.key !== "Enter") {
    return;
  }

  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase()
    .trim();

  if (searchTerm === "") {
    // If search cleared, revert to category view
    isSearchActive = false;
    displayMenuItems();
    return;
  }

  isSearchActive = true;

  // Filter items by search term
  filteredItems = allMenuItems.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  });

  // Display search results
  displayMenuItems(true);
}

// Function to display menu items based on current category or search
function displayMenuItems(isSearchResult = false) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  // Determine which items to display
  let displayItems = isSearchResult ? filteredItems : allMenuItems;

  // Filter by category if not searching and not "all" category
  if (!isSearchResult && currentCategory !== "all") {
    displayItems = displayItems.filter(
      (item) => item.categoryId === currentCategory
    );
  }

  // Check if there are items to display
  if (displayItems.length === 0) {
    menuList.innerHTML = `
                    <div class="no-results">
                        <h3>${
                          isSearchResult
                            ? "No search results found"
                            : "No items found"
                        }</h3>
                        <p>${
                          isSearchResult
                            ? "Try different keywords or browse our menu categories"
                            : "There are no items in this category yet"
                        }</p>
                    </div>
                `;
    return;
  }

  // Display items
  displayItems.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("menu-item");

    // Find category name
    let categoryName = "Uncategorized";
    const category = categories.find((cat) => cat.id === item.categoryId);
    if (category) {
      categoryName = category.name;
    }

    div.innerHTML = `
                    <img src="${
                      item.image || "/api/placeholder/400/320"
                    }" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>₹${item.price}</p>
                    <div style="color:#666;margin-bottom:10px;font-size:14px;">
                        ${item.description || ""}
                        <br>
                        <span style="color:#999;">${categoryName}</span>
                    </div>
                    <button onclick="addToCart('${item.id}', '${item.name}', ${
      item.price
    })">Add to Cart</button>
                `;
    menuList.appendChild(div);
  });
}

// Function to display menu items based on current category
function displayMenuItems(isSearchResult = false) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  // Determine which items to display
  let displayItems = isSearchResult ? filteredItems : allMenuItems;

  // Filter by category if not searching and not "all" category
  if (!isSearchResult && currentCategory !== "all") {
    displayItems = displayItems.filter(
      (item) => item.categoryId === currentCategory
    );
  }

  // Check if there are items to display
  if (displayItems.length === 0) {
    menuList.innerHTML = `
      <div class="no-results">
        <h3>${
          isSearchResult ? "No search results found" : "No items found"
        }</h3>
        <p>${
          isSearchResult
            ? "Try different keywords or browse our menu categories"
            : "There are no items in this category yet"
        }</p>
      </div>
    `;
    return;
  }

  // Display items
  displayItems.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("menu-item");

    // Find category name
    let categoryName = "Uncategorized";
    const category = categories.find((cat) => cat.id === item.categoryId);
    if (category) {
      categoryName = category.name;
    }

    div.innerHTML = `
      <img src="${item.image || "/api/placeholder/400/320"}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>₹${item.price}</p>
      <div style="color:#666;margin-bottom:10px;font-size:14px;">
        ${item.description || ""}
        <br>
        <span style="color:#999;">${categoryName}</span>
      </div>
      <button onclick="addToCart('${item.id}', '${item.name}', ${
      item.price
    })">Add to Cart</button>
    `;
    menuList.appendChild(div);
  });
}

// Add demo items to Firebase
function addDemoItems() {
  // First load categories
  return loadCategories().then((categories) => {
    if (categories.length === 0) {
      console.error("No categories available");
      return;
    }

    const batch = db.batch();
    // const demoItems = [
    //   {
    //     name: "Margherita Pizza",
    //     price: 250,
    //     image: "/api/placeholder/400/320",
    //     description: "Classic cheese pizza with tomato sauce",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Main Course")?.id ||
    //       categories[0].id,
    //   },
    //   {
    //     name: "Veg Biryani",
    //     price: 200,
    //     image: "/api/placeholder/400/320",
    //     description: "Fragrant rice dish with mixed vegetables and spices",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Main Course")?.id ||
    //       categories[0].id,
    //   },
    //   {
    //     name: "Paneer Butter Masala",
    //     price: 220,
    //     image: "/api/placeholder/400/320",
    //     description: "Cottage cheese in a rich tomato gravy",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Main Course")?.id ||
    //       categories[0].id,
    //   },
    //   {
    //     name: "Chicken Curry",
    //     price: 280,
    //     image: "/api/placeholder/400/320",
    //     description: "Tender chicken pieces in a spiced curry sauce",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Main Course")?.id ||
    //       categories[0].id,
    //   },
    //   {
    //     name: "Tandoori Roti",
    //     price: 30,
    //     image: "/api/placeholder/400/320",
    //     description: "Traditional Indian flatbread",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Starters")?.id ||
    //       categories[1].id,
    //   },
    //   {
    //     name: "Cold Coffee",
    //     price: 120,
    //     image: "/api/placeholder/400/320",
    //     description: "Refreshing cold coffee with ice cream",
    //     categoryId:
    //       categories.find((cat) => cat.name === "Beverages")?.id ||
    //       categories[3].id,
    //   },
    // ];

    demoItems.forEach((item) => {
      const newItemRef = menuCollection.doc();
      batch.set(newItemRef, item);
    });

    return batch
      .commit()
      .then(() => {
        console.log("Demo items added to Firebase");
      })
      .catch((error) => {
        console.error("Error adding demo items: ", error);
      });
  });
}

// Load admin panel with current menu items
function loadAdminPanel() {
  const itemList = document.getElementById("admin-item-list");
  itemList.innerHTML = '<div class="loader"></div>';

  loadMenu().then((items) => {
    itemList.innerHTML = "";

    if (items.length === 0) {
      itemList.innerHTML = "<p class='empty-state'>No menu items found.</p>";
      return;
    }

    items.forEach((item) => {
      // Find category name
      let categoryName = "Uncategorized";
      const category = categories.find((cat) => cat.id === item.categoryId);
      if (category) {
        categoryName = category.name;
      }

      const div = document.createElement("div");
      div.classList.add("admin-item");
      div.innerHTML = `
                        <div class="admin-item-details">
                            <strong>${item.name}</strong> - ₹${item.price}
                            <br>
                            <small>${categoryName}</small>
                        </div>
                        <div class="admin-item-actions">
                            <button class="edit-item" onclick="editItem('${item.id}')">Edit</button>
                            <button class="delete-item" onclick="deleteItem('${item.id}')">Delete</button>
                        </div>
                    `;
      itemList.appendChild(div);
    });
  });

  // Also load categories
  loadAdminCategories();
}

// Load categories in admin panel
function loadAdminCategories() {
  const categoryList = document.getElementById("admin-category-list");
  categoryList.innerHTML = '<div class="loader"></div>';

  loadCategories().then((categoriesList) => {
    categoryList.innerHTML = "";

    if (categoriesList.length === 0) {
      categoryList.innerHTML =
        "<p class='empty-state'>No categories found.</p>";
      return;
    }

    categoriesList.forEach((category) => {
      const div = document.createElement("div");
      div.classList.add("category-item");
      div.innerHTML = `
                        <span>${category.name}</span>
                        <button class="delete-item" onclick="deleteCategory('${category.id}')">Delete</button>
                    `;
      categoryList.appendChild(div);
    });
  });
}

// Function to add a new menu item
function addMenuItem(name, description, price, categoryId, imageUrl) {
  // Use default placeholder if no image URL provided
  if (!imageUrl || imageUrl.trim() === "") {
    imageUrl = "/api/placeholder/400/320";
  }

  return menuCollection.add({
    name: name,
    description: description || "",
    price: parseInt(price),
    categoryId: categoryId,
    image: imageUrl,
  });
}

// Function to edit a menu item
function editItem(id) {
  const item = allMenuItems.find((item) => item.id === id);
  if (!item) return;

  // Populate form for editing
  document.getElementById("item-name").value = item.name;
  document.getElementById("item-description").value = item.description || "";
  document.getElementById("item-price").value = item.price;
  document.getElementById("item-category").value = item.categoryId || "";
  document.getElementById("item-image").value = item.image || "";
  // Add hidden input for item ID and change button text
  let form = document.getElementById("add-item-form");
  let idInput = document.createElement("input");
  idInput.type = "hidden";
  idInput.id = "edit-item-id";
  idInput.value = id;
  form.appendChild(idInput);

  // Change form submit button text
  document.querySelector("#add-item-form button").textContent = "Update Item";

  // Scroll to form
  form.scrollIntoOffset = true;
}

// Function to update a menu item
function updateMenuItem(id, name, description, price, categoryId, imageUrl) {
  // Use default placeholder if no image URL provided
  if (!imageUrl || imageUrl.trim() === "") {
    imageUrl = "/api/placeholder/400/320";
  }

  return menuCollection.doc(id).update({
    name: name,
    description: description || "",
    price: parseInt(price),
    categoryId: categoryId,
    image: imageUrl,
  });
}

// Function to delete a menu item
function deleteItem(id) {
  if (confirm("Are you sure you want to delete this item?")) {
    menuCollection
      .doc(id)
      .delete()
      .then(() => {
        showNotification("Item deleted successfully!");
        loadAdminPanel();
        loadMenu();
      })
      .catch((error) => {
        console.error("Error deleting item: ", error);
        showNotification("Error deleting item", true);
      });
  }
}

// Function to add a new category
function addCategory(name) {
  return categoryCollection.add({
    name: name,
  });
}

// Function to delete a category
function deleteCategory(id) {
  // Check if category is in use
  const itemsUsingCategory = allMenuItems.filter(
    (item) => item.categoryId === id
  );

  if (itemsUsingCategory.length > 0) {
    alert(
      `This category cannot be deleted because it is used by ${itemsUsingCategory.length} menu items. Reassign these items to other categories first.`
    );
    return;
  }

  if (confirm("Are you sure you want to delete this category?")) {
    categoryCollection
      .doc(id)
      .delete()
      .then(() => {
        showNotification("Category deleted successfully!");
        loadCategories().then(updateCategoryTabs);
        loadAdminCategories();
      })
      .catch((error) => {
        console.error("Error deleting category: ", error);
        showNotification("Error deleting category", true);
      });
  }
}

// CART FUNCTIONALITY
let cart = [];

// Function to add an item to the cart
function addToCart(id, name, price) {
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: id,
      name: name,
      price: price,
      quantity: 1,
    });
  }

  updateCartUI();
  showNotification(`Added ${name} to cart!`);
}

// Function to remove an item from the cart
function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  updateCartUI();
  showNotification("Item removed from cart");
}

// Function to update cart quantity
function updateCartQuantity(id, quantity) {
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.quantity = parseInt(quantity);
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  }
}

// Function to update the cart UI
function updateCartUI() {
  const cartItems = document.getElementById("cart-items");
  const cartBadge = document.getElementById("cart-badge");
  const totalAmount = document.getElementById("cart-total-amount");
  let total = 0;
  let itemCount = 0;

  // Clear current cart display
  cartItems.innerHTML = "";

  // Check if cart is empty
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-state">Your cart is empty</div>';
    cartBadge.textContent = "0";
    totalAmount.textContent = "₹0";
    return;
  }

  // Display cart items
  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    itemCount += item.quantity;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
                    <div>
                        <div><strong>${item.name}</strong></div>
                        <div>₹${item.price} × 
                            <input type="number" min="1" value="${item.quantity}" 
                                onchange="updateCartQuantity('${item.id}', this.value)" style="width:40px;"> 
                            = ₹${itemTotal}
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;cursor:pointer;font-size:18px;">🗑️</button>
                `;
    cartItems.appendChild(div);
  });

  // Update total
  cartBadge.textContent = itemCount;
  totalAmount.textContent = `₹${total}`;

  // Clear any existing QR code
  document.getElementById("qrcode").innerHTML = "";
}

// Function to toggle cart visibility
function toggleCart() {
  document.getElementById("cart").classList.toggle("active");
}

// Function to toggle admin panel
function toggleAdmin() {
  document.getElementById("admin-panel").classList.toggle("active");
}

// Function to switch admin tabs
function switchAdminTab(tabId) {
  // Update active tab
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.classList.remove("active");
    if (tab.textContent.toLowerCase().includes(tabId.split("-")[0])) {
      tab.classList.add("active");
    }
  });

  // Update active content
  document.querySelectorAll(".admin-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");
}

// Show notification
function showNotification(message, isError = false) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.backgroundColor = isError ? "#ff3333" : "#4CAF50";
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Generate QR code for the cart
// Generate QR code for the cart
function generateQRCode() {
  if (cart.length === 0) {
    showNotification("Your cart is empty", true);
    return;
  }

  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = "";

  // Create cart data to encode
  const cartData = {
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    timestamp: new Date().toISOString(),
  };

  // Generate QR code with larger dimensions
  new QRCode(qrcodeContainer, {
    text: JSON.stringify(cartData),
    width: 256, // Increased width
    height: 256, // Increased height
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// Checkout function
function checkout() {
  if (cart.length === 0) {
    showNotification("Your cart is empty", true);
    return;
  }

  alert(
    "Thank you for your order! Your total is ₹" +
      cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  cart = [];
  updateCartUI();
  toggleCart();
  showNotification("Order placed successfully!");
}

// Event listeners for forms
document
  .getElementById("add-item-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("item-name").value;
    const description = document.getElementById("item-description").value;
    const price = document.getElementById("item-price").value;
    const categoryId = document.getElementById("item-category").value;
    const imageUrl = document.getElementById("item-image").value;
    const editId = document.getElementById("edit-item-id")?.value;

    // Validate category selection
    if (!categoryId) {
      showNotification("Please select a category", true);
      return;
    }

    let promise;
    if (editId) {
      // Update existing item
      promise = updateMenuItem(
        editId,
        name,
        description,
        price,
        categoryId,
        imageUrl
      );
    } else {
      // Add new item
      promise = addMenuItem(name, description, price, categoryId, imageUrl);
    }

    promise
      .then(() => {
        // Reset form
        this.reset();
        if (editId) {
          // Remove hidden input and restore button text
          document.getElementById("edit-item-id").remove();
          document.querySelector("#add-item-form button").textContent =
            "Add Item";
        }
        showNotification(
          editId ? "Item updated successfully!" : "Item added successfully!"
        );
        loadMenu();
        loadAdminPanel();
      })
      .catch((error) => {
        console.error("Error saving item: ", error);
        showNotification("Error saving item", true);
      });
  });

document
  .getElementById("add-category-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("category-name").value;

    addCategory(name)
      .then(() => {
        this.reset();
        showNotification("Category added successfully!");
        loadCategories().then(updateCategoryTabs);
        loadAdminCategories();
      })
      .catch((error) => {
        console.error("Error adding category: ", error);
        showNotification("Error adding category", true);
      });
  });

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Load categories first, then menu items
  loadCategories()
    .then((categoriesList) => {
      updateCategoryTabs(categoriesList);
      return loadMenu();
    })
    .then(() => {
      loadAdminPanel();
    })
    .catch((error) => {
      console.error("Error initializing app: ", error);
      showNotification("Error loading menu data", true);
    });
});
