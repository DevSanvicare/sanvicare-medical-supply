import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDx_3O-ODKiPYCXSykQ9iqb3iJn08z9P9k",
  authDomain: "devsanvicare-56e5c.firebaseapp.com",
  databaseURL:
    "https://devsanvicare-56e5c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "devsanvicare-56e5c",
  storageBucket: "devsanvicare-56e5c.firebasestorage.app",
  messagingSenderId: "120747231459",
  appId: "1:120747231459:web:fbb7e9d46888524f19ddd6",
  measurementId: "G-09XTL0WPC0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// AUTO REDIRECT IF NOT LOGGED IN
const savedUser = localStorage.getItem("sanvicareUser");

if (!savedUser) {
  window.location.href = "./auth/";
}

function updateNavPadding() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Check if content is overflowing vertically
  const hasVerticalScroll = nav.scrollHeight > nav.clientHeight;

  if (hasVerticalScroll) {
    nav.classList.add("has-scroll");
  } else {
    nav.classList.remove("has-scroll");
  }
}

// Run once on load
updateNavPadding();

// Run again on resize (important for responsiveness)
window.addEventListener("resize", updateNavPadding);

const listenToProducts = () => {
  const tableBody = document.getElementById("productsTableBody");

  const user = auth.currentUser;

  const productsQuery = query(
    collection(db, "products"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center;">Loading...</td>
    </tr>
  `;

  onSnapshot(productsQuery, async (querySnapshot) => {
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">No products found.</td>
        </tr>
      `;
      return;
    }

    let hasProducts = false;

    querySnapshot.forEach((docSnap) => {
      const productId = docSnap.id;

      hasProducts = true;
      const product = docSnap.data();
      const tr = document.createElement("tr");

      const productName = product.productName || "—";
      const brand = product.brand || "—";
      const location = product.location || "—";
      const unitCost = product.unitCost || "—";
      const sellingPrice = product.sellingPrice || "—";
      const stocksLeft = product.stocksLeft || "—";

      tr.innerHTML = `
        <td>${productName}</td>
        <td>${brand}</td>
        <td>${location}</td>
        <td>${unitCost}</td>
        <td>${sellingPrice}</td>
        <td>${stocksLeft}</td>
        <td>
          <button class="action-btn add-stock-btn" data-id="${productId}">
            <i class="uil uil-plus"></i>
          </button>

          <button class="action-btn subtract-stock-btn" data-id="${productId}">
            <i class="uil uil-minus"></i>
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    if (!hasProducts) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">No products found.</td>
        </tr>
      `;
    }

    attachActionButtons();
  });
};

function attachActionButtons() {
  // ADD STOCK BUTTON
  document.querySelectorAll(".add-stock-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data();

          document.getElementById("stockProductId").value = id;
          document.getElementById("stockAction").value = "Add";

          document.getElementById("stockModalTitle").innerText = "Add Stock";

          document.getElementById("stockProductName").value =
            product.productName || "";

          document.getElementById("currentStock").value =
            product.stocksLeft || 0;

          document.getElementById("stockQuantity").value = 1;

          document.getElementById("stockModal").style.visibility = "visible";

          document.body.classList.add("modal-open");
        }
      } catch (error) {
        console.error(error);

        Swal.fire("Error", "Failed to load product.", "error");
      }
    });
  });

  // SUBTRACT STOCK BUTTON
  document.querySelectorAll(".subtract-stock-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data();

          document.getElementById("stockProductId").value = id;
          document.getElementById("stockAction").value = "Subtract";

          document.getElementById("stockModalTitle").innerText =
            "Subtract Stock";

          document.getElementById("stockProductName").value =
            product.productName || "";

          document.getElementById("currentStock").value =
            product.stocksLeft || 0;

          document.getElementById("stockQuantity").value = 1;

          document.getElementById("stockModal").style.visibility = "visible";

          document.body.classList.add("modal-open");
        }
      } catch (error) {
        console.error(error);

        Swal.fire("Error", "Failed to load product.", "error");
      }
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./auth/";
  } else {
    document.getElementById("container").style.visibility = "visible";
    try {
      const docRef = doc(db, "admins", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const displayName = userData.name || "Name";
        const nameElement = document.getElementById("userNameDisplay");
        const userAvatar = document.getElementById("userAvatar");
        if (nameElement) {
          nameElement.textContent = displayName;
        }
        if (userAvatar) {
          userAvatar.src =
            "https://api.dicebear.com/9.x/adventurer/svg?flip=true&seed=Jocelyn";
        }
      } else {
        console.log("User document not found");
      }

      listenToProducts();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("body");
  const modeToggle = body.querySelector(".mode-toggle");
  const sidebar = body.querySelector("nav");
  const sidebarToggle = body.querySelector(".sidebar-toggle");
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutIcon = document.getElementById("logoutIcon");

  let getMode = localStorage.getItem("mode");
  if (getMode === "dark") {
    body.classList.add("dark");
  }

  let getStatus = localStorage.getItem("status");
  if (getStatus === "close") {
    sidebar.classList.add("close");
  }

  modeToggle?.addEventListener("click", () => {
    body.classList.toggle("dark");
    localStorage.setItem(
      "mode",
      body.classList.contains("dark") ? "dark" : "light",
    );
  });

  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("close");
    localStorage.setItem(
      "status",
      sidebar.classList.contains("close") ? "close" : "open",
    );
  });

  const logoutHandler = () => {
    Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been signed out.",
    }).then(async () => {
      try {
        await signOut(auth);
        localStorage.removeItem("sanvicareUser");
        window.location.href = "./auth/";
      } catch (error) {
        console.error("Logout error:", error);
        Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: "Something went wrong while logging out.",
        });
      }
    });
  };

  if (logoutBtn) logoutBtn.addEventListener("click", logoutHandler);
  if (logoutIcon) logoutIcon.addEventListener("click", logoutHandler);

  document.getElementById("searchInput").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#productsTableBody tr");

    rows.forEach((row) => {
      const productCell = row.querySelector("td:first-child");
      if (productCell) {
        const text = productCell.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      }
    });
  });

  document.getElementById("searchBtn").addEventListener("click", () => {
    document.getElementById("searchInput").focus();
  });

  document.getElementById("stockModalClose").addEventListener("click", () => {
    document.getElementById("stockModal").style.visibility = "hidden";

    document.body.classList.remove("modal-open");
  });

  const stockForm = document.getElementById("stockForm");

  let isSubmitting = false;

  stockForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // PREVENT DOUBLE SUBMIT
    if (isSubmitting) return;

    isSubmitting = true;

    const submitBtn = stockForm.querySelector(".submit-button");

    const originalBtnText = submitBtn.innerHTML;

    // DISABLE BUTTON + SHOW LOADING
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
    <i class="uil uil-spinner-alt spin"></i> Processing...
  `;

    try {
      const id = document.getElementById("stockProductId").value;

      const action = document.getElementById("stockAction").value;

      const currentStock = Number(
        document.getElementById("currentStock").value,
      );

      const reason = document.getElementById("stockReason").value.trim();

      const quantity = Number(document.getElementById("stockQuantity").value);

      if (quantity <= 0) {
        Swal.fire(
          "Invalid Quantity",
          "Quantity must be greater than 0.",
          "warning",
        );

        return;
      }

      let newStock = currentStock;

      if (action === "Add") {
        newStock += quantity;
      } else {
        newStock -= quantity;

        if (newStock < 0) {
          Swal.fire(
            "Insufficient Stock",
            "Stock cannot go below zero.",
            "warning",
          );

          return;
        }
      }

      await setDoc(
        doc(db, "products", id),
        {
          stocksLeft: newStock,
          isActive: true,
        },
        { merge: true },
      );

      const productRef = doc(db, "products", id);

      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        Swal.fire("Error", "Product not found", "error");

        return;
      }

      const product = productSnap.data();

      const adminRef = doc(db, "admins", auth.currentUser.uid);

      const adminSnap = await getDoc(adminRef);

      const adminName = adminSnap.exists()
        ? adminSnap.data().name
        : "Unknown Admin";

      await addDoc(collection(db, "history"), {
        productName: product.productName,
        action,
        quantity,
        previousStock: currentStock,
        newStock,
        reason: reason || "",
        adminName,
        createdAt: serverTimestamp(),
      });

      Swal.fire(
        "Success",
        `Stock successfully ${action === "Add" ? "added" : "subtracted"}.`,
        "success",
      );

      document.getElementById("stockModal").style.visibility = "hidden";

      document.body.classList.remove("modal-open");

      stockForm.reset();
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "Failed to update stock.", "error");
    } finally {
      // ALWAYS RE-ENABLE BUTTON
      isSubmitting = false;

      submitBtn.disabled = false;

      submitBtn.innerHTML = originalBtnText;
    }
  });
});
