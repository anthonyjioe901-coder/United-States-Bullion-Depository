const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "local-users.json");

const ensureStore = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, "[]", "utf8");
  }
};

const readUsers = async () => {
  await ensureStore();

  const raw = await fs.readFile(STORE_PATH, "utf8");
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users) => {
  await ensureStore();

  await fs.writeFile(STORE_PATH, JSON.stringify(users, null, 2), "utf8");
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const findOne = async ({ email }) => {
  const users = await readUsers();
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

const create = async (userData) => {
  const users = await readUsers();
  const newUser = {
    _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fullName: userData.fullName,
    email: normalizeEmail(userData.email),
    password: userData.password,
    accountId: userData.accountId,
    role: userData.role || "user",
    totalGold: 0,
    currentValue: 0,
    monthlyFees: 0,
    lastDepositDate: null,
    vaultLocation: "Main Vault",
    notes: "",
    nextOfKin: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
};

module.exports = {
  findOne,
  create
};