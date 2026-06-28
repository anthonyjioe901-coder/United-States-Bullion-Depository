document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const API_BASE = "http://localhost:5000";

  if (!token || role !== "admin") {
    window.location.href = "../login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const sidebarLinks = document.querySelectorAll(".admin-sidebar a[data-tab]");
  const tabs = document.querySelectorAll(".admin-tab");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();

      // Remove active from all sidebar links
      sidebarLinks.forEach(l => l.classList.remove("active"));

      // Hide all tabs
      tabs.forEach(tab => tab.classList.remove("active"));

      // Activate clicked link
      link.classList.add("active");

      // Show matching tab
      const targetId = link.dataset.tab;
      const targetTab = document.getElementById(targetId);

      if (targetTab) {
        targetTab.classList.add("active");
      }
    });
  });

  const formatDate = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);

  const loadSummary = async () => {
    const response = await fetch(`${API_BASE}/api/admin/summary`, {
      headers: authHeaders
    });
    if (!response.ok) return;
    const data = await response.json();
    const totalCustomers = document.getElementById("totalCustomers");
    const totalGoldStored = document.getElementById("totalGoldStored");
    const pendingRequests = document.getElementById("pendingRequests");

    if (totalCustomers) totalCustomers.textContent = data.totalUsers;
    if (totalGoldStored) totalGoldStored.textContent = `${data.totalGold} oz`;
    if (pendingRequests) pendingRequests.textContent = data.pendingRequests;
  };

  const renderRequests = (items, containerId) => {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item.userName || "Unknown"}</td>
        <td>${item.amount} oz</td>
        <td>${formatDate(item.createdAt)}</td>
        <td>${item.status}</td>
        <td>
          <button class="approve" data-id="${item._id}">Approve</button>
          <button class="reject" data-id="${item._id}">Reject</button>
        </td>
      </tr>
    `).join("") || "<tr><td colspan=\"5\">No requests found</td></tr>";

    tbody.querySelectorAll(".approve").forEach(btn => {
      btn.addEventListener("click", () => updateStatus(btn.dataset.id, "approve"));
    });
    tbody.querySelectorAll(".reject").forEach(btn => {
      btn.addEventListener("click", () => updateStatus(btn.dataset.id, "reject"));
    });
  };

  const updateStatus = async (id, action) => {
    const response = await fetch(`${API_BASE}/api/admin/transactions/${id}/${action}`, {
      method: "POST",
      headers: authHeaders
    });

    if (response.ok) {
      await loadAll();
    } else {
      const data = await response.json();
      alert(data.message || "Action failed");
    }
  };

  const loadDeposits = async () => {
    const [depositsRes, usersRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/deposits`, { headers: authHeaders }),
      fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders })
    ]);
    if (!depositsRes.ok || !usersRes.ok) return;
    const depositsData = await depositsRes.json();
    const usersData = await usersRes.json();
    const userMap = usersData.users.reduce((map, user) => {
      map[user.id] = user.fullName;
      return map;
    }, {});
    const items = depositsData.deposits.map(d => ({
      ...d,
      userName: userMap[d.userId] || "Unknown"
    }));
    renderRequests(items, "adminDepositsBody");
  };

  const loadWithdrawals = async () => {
    const [withdrawalsRes, usersRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/withdrawals`, { headers: authHeaders }),
      fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders })
    ]);
    if (!withdrawalsRes.ok || !usersRes.ok) return;
    const withdrawalsData = await withdrawalsRes.json();
    const usersData = await usersRes.json();
    const userMap = usersData.users.reduce((map, user) => {
      map[user.id] = user.fullName;
      return map;
    }, {});
    const items = withdrawalsData.withdrawals.map(w => ({
      ...w,
      userName: userMap[w.userId] || "Unknown"
    }));
    renderRequests(items, "adminWithdrawalsBody");
  };

  const loadUsers = async () => {
    const response = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders });
    if (!response.ok) return;
    const data = await response.json();
    const tbody = document.getElementById("adminUsersBody");
    if (!tbody) return;
    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td>${user.fullName}</td>
        <td>${user.email}</td>
        <td>${user.nextOfKin || "Not set"}</td>
        <td>${user.totalGold} oz</td>
        <td>€${(user.currentValue || 0).toLocaleString()}</td>
        <td>€${(user.monthlyFees || 0).toLocaleString()}</td>
        <td>${user.lastDepositDate ? formatDate(user.lastDepositDate) : "N/A"}</td>
        <td><button class="edit-user-btn" data-id="${user.id}">Edit</button></td>
      </tr>
    `).join("") || "<tr><td colspan=\"8\">No users found</td></tr>";

    // Attach edit button listeners
    tbody.querySelectorAll(".edit-user-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
  };

  const openEditModal = async (userId) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, { headers: authHeaders });
    if (!response.ok) {
      alert("Failed to load user data");
      return;
    }
    const user = await response.json();

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUserName").textContent = user.fullName;
    document.getElementById("editUserEmail").textContent = user.email;
    document.getElementById("editTotalGold").value = user.totalGold || 0;
    document.getElementById("editCurrentValue").value = user.currentValue || 0;
    document.getElementById("editMonthlyFees").value = user.monthlyFees || 0;
    document.getElementById("editNextOfKin").value = user.nextOfKin || "";
    document.getElementById("editLastDepositDate").value = user.lastDepositDate ? new Date(user.lastDepositDate).toISOString().slice(0, 10) : "";
    document.getElementById("editVaultLocation").value = user.vaultLocation || "Main Vault";
    document.getElementById("editNotes").value = user.notes || "";

    document.getElementById("editUserModal").style.display = "block";
  };

  // Edit User Modal handlers
  const editUserModal = document.getElementById("editUserModal");
  const closeEditModal = document.getElementById("closeEditModal");
  
  if (closeEditModal) {
    closeEditModal.addEventListener("click", () => {
      editUserModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === editUserModal) {
      editUserModal.style.display = "none";
    }
  });

  const editUserForm = document.getElementById("editUserForm");
  if (editUserForm) {
    editUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("editUserId").value;
      const updateData = {
        totalGold: Number(document.getElementById("editTotalGold").value),
        currentValue: Number(document.getElementById("editCurrentValue").value),
        monthlyFees: Number(document.getElementById("editMonthlyFees").value),
        nextOfKin: document.getElementById("editNextOfKin").value,
        lastDepositDate: document.getElementById("editLastDepositDate").value || null,
        vaultLocation: document.getElementById("editVaultLocation").value,
        notes: document.getElementById("editNotes").value
      };

      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert("User updated successfully!");
        editUserModal.style.display = "none";
        loadAll();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update user");
      }
    });
  }

  const loadTransactions = async () => {
    const [transactionsRes, usersRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/transactions`, { headers: authHeaders }),
      fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders })
    ]);
    if (!transactionsRes.ok || !usersRes.ok) return;
    const transactionsData = await transactionsRes.json();
    const usersData = await usersRes.json();
    const userMap = usersData.users.reduce((map, user) => {
      map[user.id] = user.fullName;
      return map;
    }, {});
    const tbody = document.getElementById("adminTransactionsBody");
    if (!tbody) return;
    tbody.innerHTML = transactionsData.transactions.map(tx => `
      <tr>
        <td>${userMap[tx.userId] || "Unknown"}</td>
        <td>${tx.type}</td>
        <td>${tx.amount} oz</td>
        <td>${formatDate(tx.createdAt)}</td>
        <td>${tx.status}</td>
      </tr>
    `).join("") || "<tr><td colspan=\"5\">No transactions found</td></tr>";
  };

  const loadAll = async () => {
    await Promise.all([
      loadSummary(),
      loadDeposits(),
      loadWithdrawals(),
      loadUsers(),
      loadTransactions()
    ]);
  };

  const logout = document.querySelector(".logout");
  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "../login.html";
    });
  }

  // Admin Password Change Form
  const adminPasswordForm = document.getElementById("adminPasswordForm");
  if (adminPasswordForm) {
    adminPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("adminCurrentPassword").value;
      const newPassword = document.getElementById("adminNewPassword").value;
      const confirmPassword = document.getElementById("adminConfirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match");
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/password`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password updated successfully!");
        adminPasswordForm.reset();
      } else {
        alert(data.message || "Failed to update password");
      }
    });
  }

  // Change User Role Form
  const changeRoleForm = document.getElementById("changeRoleForm");
  if (changeRoleForm) {
    changeRoleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("roleUserEmail").value;
      const role = document.getElementById("roleSelect").value;

      const response = await fetch(`${API_BASE}/api/admin/user-role`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ email, role })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`User role updated to ${role}!`);
        changeRoleForm.reset();
        loadUsers();
      } else {
        alert(data.message || "Failed to update role");
      }
    });
  }

  loadAll();

});
