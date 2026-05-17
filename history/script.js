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

const listenToHistory = () => {
  const tableBody = document.getElementById("historyTableBody");

  const historyQuery = query(
    collection(db, "history"),
    orderBy("createdAt", "desc"),
  );

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center;">Loading...</td>
    </tr>
  `;

  const actionFilter = document.getElementById("actionFilter");
  const actions = new Set();

  actionFilter.innerHTML = `<option value="">All</option>`;

  onSnapshot(historyQuery, async (querySnapshot) => {
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center;">No history found.</td>
        </tr>
      `;
      return;
    }

    let hasHistory = false;

    querySnapshot.forEach((docSnap) => {
      const historyId = docSnap.id;

      hasHistory = true;
      const history = docSnap.data();
      const tr = document.createElement("tr");

      const productName = history.productName || "—";
      const action = history.action || "—";
      actions.add(action);
      const quantity = history.quantity || "—";
      const previousStock = history.previousStock || "—";
      const newStock = history.newStock || "—";
      const reason = history.reason || "—";
      const adminName = history.adminName || "—";
      const createdAt = history.createdAt?.toDate().toLocaleString() || "—";

      tr.innerHTML = `
        <td>${productName}</td>
        <td>${action}</td>
        <td>${quantity}</td>
        <td>${previousStock}</td>
        <td>${newStock}</td>
        <td>${reason}</td>
        <td>${adminName}</td>
        <td>${createdAt}</td>
      `;

      tableBody.appendChild(tr);
    });

    actions.forEach((action) => {
      const option = document.createElement("option");
      option.value = action;
      option.textContent = action;
      actionFilter.appendChild(option);
    });

    if (!hasHistory) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center;">No history found.</td>
        </tr>
      `;
    }
  });
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../auth/";
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

      listenToHistory();
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

  const applyFilters = () => {
    const searchFilter = document
      .getElementById("searchInput")
      .value.toLowerCase();

    const actionFilter = document.getElementById("actionFilter").value;

    const rows = document.querySelectorAll("#historyTableBody tr");

    rows.forEach((row) => {
      const nameCell = row.querySelector("td:first-child");
      const actionCell = row.querySelector("td:nth-child(2)");

      if (!nameCell || !actionCell) return;

      const nameText = nameCell.textContent.toLowerCase();
      const actionText = actionCell.textContent.trim();

      const matchesSearch = nameText.includes(searchFilter);

      const matchesAction = actionFilter === "" || actionText === actionFilter;

      row.style.display = matchesSearch && matchesAction ? "" : "none";
    });
  };

  document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);

  document
    .getElementById("actionFilter")
    .addEventListener("change", applyFilters);

  document.getElementById("searchBtn").addEventListener("click", () => {
    document.getElementById("searchInput").focus();
  });
});
