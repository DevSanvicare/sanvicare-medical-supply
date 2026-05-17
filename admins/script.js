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

const listenToAdmins = () => {
  const tableBody = document.getElementById("adminsTableBody");

  const adminsQuery = query(
    collection(db, "admins"),
    orderBy("createdAt", "desc"),
  );

  tableBody.innerHTML = `
    <tr>
      <td colspan="3" style="text-align: center;">Loading...</td>
    </tr>
  `;

  onSnapshot(adminsQuery, async (querySnapshot) => {
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No admins found.</td>
        </tr>
      `;
      return;
    }

    let hasAdmins = false;

    querySnapshot.forEach((docSnap) => {
      const adminId = docSnap.id;

      hasAdmins = true;
      const admin = docSnap.data();
      const tr = document.createElement("tr");

      const email = admin.email || "—";
      const name = admin.name || "—";
      const createdAt = admin.createdAt?.toDate().toLocaleString() || "—";

      tr.innerHTML = `
        <td>${email}</td>
        <td>${name}</td>
        <td>${createdAt}</td>
      `;

      tableBody.appendChild(tr);
    });

    if (!hasAdmins) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No admins found.</td>
        </tr>
      `;
    }
  });
};

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

      listenToAdmins();
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
    const rows = document.querySelectorAll("#adminsTableBody tr");

    rows.forEach((row) => {
      const adminCell = row.querySelector("td:first-child");
      if (adminCell) {
        const text = adminCell.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      }
    });
  });

  document.getElementById("searchBtn").addEventListener("click", () => {
    document.getElementById("searchInput").focus();
  });
});
