const token = localStorage.getItem("token");
const API_BASE = "http://localhost:5000";
if (!token) window.location.href = "login.html";

document.addEventListener("DOMContentLoaded", () => {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const updateTables = (transactions) => {
    const formatStatusClass = (status) => {
      if (status === "Approved") return "completed";
      if (status === "Rejected") return "rejected";
      return "pending";
    };

    const rows = transactions.map(t => {
      const date = new Date(t.createdAt).toISOString().slice(0, 10);
      const type = t.type === "deposit" ? "Deposit" : "Withdraw";
      const statusClass = formatStatusClass(t.status);
      return `
        <tr>
          <td>${date}</td>
          <td>${type}</td>
          <td>${t.amount} oz</td>
          <td class="${statusClass}"><p class="status">${t.status}</p></td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll(".recent-transactions tbody").forEach(tbody => {
      tbody.innerHTML = rows || "<tr><td colspan=\"4\">No transactions yet</td></tr>";
    });
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user/dashboard`, {
        headers: authHeaders
      });
      if (!response.ok) throw new Error("Failed to load dashboard");
      const data = await response.json();

      // Update main balance section
      const goldBalance = document.getElementById("goldBalance");
      const goldValue = document.getElementById("goldValue");
      if (goldBalance) goldBalance.textContent = `${(data.totalGold || 0).toFixed(2)} oz`;
      if (goldValue) goldValue.textContent = `€${(data.currentValue || 0).toLocaleString()}`;

      // Update overview cards
      const cardGoldStored = document.getElementById("cardGoldStored");
      const cardCurrentValue = document.getElementById("cardCurrentValue");
      const cardMonthlyFees = document.getElementById("cardMonthlyFees");
      const cardNotifications = document.getElementById("cardNotifications");
      const cardLastDeposit = document.getElementById("cardLastDeposit");
      
      if (cardGoldStored) cardGoldStored.textContent = `${(data.totalGold || 0).toFixed(2)} oz`;
      if (cardCurrentValue) cardCurrentValue.textContent = `€${(data.currentValue || 0).toLocaleString()}`;
      if (cardMonthlyFees) cardMonthlyFees.textContent = `€${(data.monthlyFees || 0).toLocaleString()}`;
      if (cardNotifications) cardNotifications.textContent = `${data.pendingCount || 0} pending`;
      if (cardLastDeposit) cardLastDeposit.textContent = data.lastDepositDate ? new Date(data.lastDepositDate).toLocaleDateString() : "N/A";

      // Update profile tab
      if (data.user) {
        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const profileAccountId = document.getElementById("profileAccountId");
        const profileCreatedAt = document.getElementById("profileCreatedAt");
        const profileNextOfKin = document.getElementById("profileNextOfKin");
        const settingsFullName = document.getElementById("fullName");
        const settingsEmail = document.getElementById("email");
        const settingsNextOfKin = document.getElementById("nextOfKin");
        const dashboardUsername = document.getElementById("dashboardUsername");
        const cardNextOfKin = document.getElementById("cardNextOfKin");
        
        if (profileName) profileName.textContent = data.user.fullName || "N/A";
        if (profileEmail) profileEmail.textContent = data.user.email || "N/A";
        if (profileAccountId) profileAccountId.textContent = data.user.accountId || "N/A";
        if (profileNextOfKin) profileNextOfKin.textContent = data.user.nextOfKin || "Not set";
        if (profileCreatedAt) profileCreatedAt.textContent = data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : "N/A";
        if (settingsFullName) settingsFullName.value = data.user.fullName || "";
        if (settingsEmail) settingsEmail.value = data.user.email || "";
        if (settingsNextOfKin) settingsNextOfKin.value = data.user.nextOfKin || "";
        if (dashboardUsername) dashboardUsername.textContent = data.user.fullName || "User";
        if (cardNextOfKin) cardNextOfKin.textContent = data.user.nextOfKin || "Not set";
      }

      // Update deposit requests table
      const depositRequestsBody = document.getElementById("depositRequestsBody");
      if (depositRequestsBody) {
        const depositRequests = (data.transactions || []).filter(t => t.type === "deposit");
        depositRequestsBody.innerHTML = depositRequests.map(t => `
          <tr>
            <td>${new Date(t.createdAt).toISOString().slice(0, 10)}</td>
            <td>${t.amount} oz</td>
            <td class="${t.status === 'Approved' ? 'completed' : t.status === 'Rejected' ? 'rejected' : 'pending'}"><p class="status">${t.status}</p></td>
          </tr>
        `).join("") || "<tr><td colspan=\"3\">No deposit requests yet</td></tr>";
      }

      updateTables(data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     SIDEBAR TAB SWITCHING
  ========================= */
  const tabs = document.querySelectorAll(".sidebar a[data-tab]");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", e => {
      e.preventDefault();

      // Remove active states
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      // Activate selected tab
      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  /* =========================
     MODALS
  ========================= */
  const depositModal = document.getElementById("requestDepositModal");
  const withdrawModal = document.getElementById("requestWithdrawModal");

  const depositBtn = document.getElementById("requestDeposit");
  const withdrawBtn = document.getElementById("requestWithdraw");

  if (depositBtn) depositBtn.addEventListener("click", () => depositModal.style.display = "block");
  if (withdrawBtn) withdrawBtn.addEventListener("click", () => withdrawModal.style.display = "block");

  // Deposit Tab Form (separate from modal)
  const depositTabForm = document.getElementById("depositTabForm");
  if (depositTabForm) {
    depositTabForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById("depositTabAmount").value);
      const response = await fetch(`${API_BASE}/api/user/deposit-requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        alert("Deposit request submitted");
        depositTabForm.reset();
        loadDashboard();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to submit deposit request");
      }
    });
  }

  const depositRequestForm = document.getElementById("depositRequestForm");
  if (depositRequestForm) {
    depositRequestForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById("depositAmount").value);
      const response = await fetch(`${API_BASE}/api/user/deposit-requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        alert("Deposit request submitted");
        depositModal.style.display = "none";
        depositRequestForm.reset();
        loadDashboard();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to submit deposit request");
      }
    });
  }

  const withdrawRequestForm = document.getElementById("withdrawRequestForm");
  if (withdrawRequestForm) {
    withdrawRequestForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById("withdrawAmount").value);
      const response = await fetch(`${API_BASE}/api/user/withdraw-requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        alert("Withdrawal request submitted");
        withdrawModal.style.display = "none";
        withdrawRequestForm.reset();
        loadDashboard();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to submit withdrawal request");
      }
    });
  }

  document.querySelectorAll(".modal .close").forEach(btn => {
    btn.addEventListener("click", () => {
      depositModal.style.display = "none";
      withdrawModal.style.display = "none";
    });
  });

  window.addEventListener("click", e => {
    if (e.target === depositModal) depositModal.style.display = "none";
    if (e.target === withdrawModal) withdrawModal.style.display = "none";
  });

  /* =========================
     SETTINGS FORMS (FRONTEND MOCK)
  ========================= */
  const personalInfoForm = document.getElementById("personalInfoForm");
  if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("email").value;
      const nextOfKin = document.getElementById("nextOfKin").value;
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ fullName, email, nextOfKin })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Personal information updated!");
      } else {
        alert(data.message || "Failed to update profile");
      }
    });
  }

  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match");
        return;
      }

      const response = await fetch(`${API_BASE}/api/user/password`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password updated!");
        passwordForm.reset();
      } else {
        alert(data.message || "Failed to update password");
      }
    });
  }

  const logoutLink = document.querySelector(".logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "login.html";
    });
  }

  /* =========================
   MOBILE SIDEBAR (HAMBURGER)
========================= */
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const sidebarOverlay = document.querySelector(".sidebar-overlay");
  const mobileTitle = document.querySelector(".mobile-title");
  const heroDepositBtn = document.getElementById("heroDepositBtn");
  const heroProfileBtn = document.getElementById("heroProfileBtn");
  const mobileProfileChip = document.querySelector(".mobile-profile-chip");
  const profileTabLink = document.querySelector('.sidebar a[data-tab="profile"]');

  const closeSidebar = () => {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("show");
  };

  const openSidebar = () => {
    if (sidebar) sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("show");
  };

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    document.querySelectorAll(".sidebar a").forEach(link => {
      link.addEventListener("click", () => {
        closeSidebar();
        if (mobileTitle && link.dataset.tab) {
          mobileTitle.textContent = link.textContent.trim();
        }
      });
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  if (heroDepositBtn) {
    heroDepositBtn.addEventListener("click", () => {
      const depositButton = document.getElementById("requestDeposit");
      if (depositButton) depositButton.click();
    });
  }

  if (heroProfileBtn && profileTabLink) {
    heroProfileBtn.addEventListener("click", () => profileTabLink.click());
  }

  if (mobileProfileChip && profileTabLink) {
    mobileProfileChip.addEventListener("click", () => profileTabLink.click());
  }

  if (mobileTitle) {
    const activeTab = document.querySelector('.sidebar a[data-tab].active');
    if (activeTab) mobileTitle.textContent = activeTab.textContent.trim();
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  });

  loadDashboard();

});


