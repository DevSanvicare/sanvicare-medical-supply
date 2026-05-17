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
  window.location.href = "../auth/";
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

  const productsQuery = query(
    collection(db, "products"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center;">Loading...</td>
    </tr>
  `;

  onSnapshot(productsQuery, async (querySnapshot) => {
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center;">No products found.</td>
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
      const createdAt = product.createdAt?.toDate().toLocaleString() || "—";

      tr.innerHTML = `
        <td>${productName}</td>
        <td>${brand}</td>
        <td>${location}</td>
        <td>${unitCost}</td>
        <td>${sellingPrice}</td>
        <td>${stocksLeft}</td>
        <td>${createdAt}</td>
        <td>
          <button class="action-btn edit-btn" title="Edit" data-id="${productId}">
            <i class="uil uil-edit-alt"></i>
          </button>

          <button class="action-btn delete-btn" title="Delete" data-id="${productId}">
              <i class="uil uil-trash-alt"></i>
            </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    if (!hasProducts) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center;">No products found.</td>
        </tr>
      `;
    }

    attachActionButtons();
  });
};

function attachActionButtons() {
  // EDIT PRODUCT BUTTON
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          return Swal.fire("Error", "Product not found", "error");
        }

        const product = productSnap.data();

        // fill modal fields
        document.getElementById("editProductId").value = id;
        document.getElementById("editProductName").value =
          product.productName || "";
        document.getElementById("editBrand").value = product.brand || "";
        document.getElementById("editLocation").value = product.location || "";
        document.getElementById("editUnitCost").value = product.unitCost || 0;
        document.getElementById("editSellingPrice").value =
          product.sellingPrice || 0;
        document.getElementById("editStocksLeft").value =
          product.stocksLeft || 0;

        // show modal
        document.getElementById("editModal").style.visibility = "visible";
        document.body.classList.add("modal-open");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load product.", "error");
      }
    });
  });

  // DELETE PRODUCT BUTTON
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      const confirm = await Swal.fire({
        title: "Delete Product?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it",
      });

      if (!confirm.isConfirmed) return;

      try {
        await setDoc(
          doc(db, "products", id),
          {
            isActive: false,
          },
          { merge: true },
        );

        Swal.fire("Deleted", "Product removed successfully.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete product.", "error");
      }
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login-register.html";
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
        window.location.href = "../auth/";
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

  document.getElementById("addProductBtn").addEventListener("click", () => {
    document.getElementById("addModal").style.visibility = "visible";
    document.body.classList.add("modal-open");
  });

  document.getElementById("addModalClose").addEventListener("click", () => {
    document.getElementById("addModal").style.visibility = "hidden";
    document.body.classList.remove("modal-open");
  });

  document.getElementById("editModalClose").addEventListener("click", () => {
    document.getElementById("editModal").style.visibility = "hidden";
    document.body.classList.remove("modal-open");
  });

  document
    .getElementById("addProductForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const productName = document
        .getElementById("addProductName")
        .value.trim();
      const brand = document.getElementById("addBrand").value.trim();
      const location = document.getElementById("addLocation").value.trim();

      // check duplicates (active only)
      const existingQuery = query(collection(db, "products"));
      const snapshot = await getDocs(existingQuery);

      const duplicate = snapshot.docs.find((d) => {
        const data = d.data();
        return (
          data.productName?.toLowerCase() === productName.toLowerCase() &&
          data.brand?.toLowerCase() === brand.toLowerCase() &&
          data.isActive !== false
        );
      });

      if (duplicate) {
        return Swal.fire(
          "Duplicate",
          "Active product already exists.",
          "warning",
        );
      }

      const productData = {
        productName,
        brand,
        location,
        unitCost: Number(document.getElementById("addUnitCost").value),
        sellingPrice: Number(document.getElementById("addSellingPrice").value),
        stocksLeft: Number(document.getElementById("addStocksLeft").value),
        isActive: true,
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "products"), productData);

        Swal.fire("Success", "Product added successfully.", "success");

        document.getElementById("addModal").style.visibility = "hidden";
        document.body.classList.remove("modal-open");

        e.target.reset();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to add product.", "error");
      }
    });

  document
    .getElementById("editProductForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("editProductId").value;

      const productName = document
        .getElementById("editProductName")
        .value.trim();
      const brand = document.getElementById("editBrand").value.trim();

      // check duplicates excluding current product
      const snapshot = await getDocs(collection(db, "products"));

      const duplicate = snapshot.docs.find((d) => {
        if (d.id === id) return false;

        const data = d.data();

        return (
          data.productName?.toLowerCase() === productName.toLowerCase() &&
          data.brand?.toLowerCase() === brand.toLowerCase() &&
          data.isActive !== false
        );
      });

      if (duplicate) {
        return Swal.fire(
          "Duplicate",
          "Another active product already exists.",
          "warning",
        );
      }

      const updatedData = {
        productName: document.getElementById("editProductName").value,
        brand: document.getElementById("editBrand").value,
        location: document.getElementById("editLocation").value,
        unitCost: Number(document.getElementById("editUnitCost").value),
        sellingPrice: Number(document.getElementById("editSellingPrice").value),
        stocksLeft: Number(document.getElementById("editStocksLeft").value),
        isActive: true,
      };

      try {
        await setDoc(doc(db, "products", id), updatedData, { merge: true });

        Swal.fire("Updated", "Product updated successfully.", "success");

        document.getElementById("editModal").style.visibility = "hidden";
        document.body.classList.remove("modal-open");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update product.", "error");
      }
    });
});
