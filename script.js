import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, get, push, ref } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const form = document.getElementById("wishlist-form");
const wishlistSection = document.getElementById("wishlist-section");
const bubbleLayer = document.getElementById("bubble-layer");
const counter = document.getElementById("wishlist-count");
const authForm = document.getElementById("auth-form");
const authStatus = document.getElementById("auth-status");
const signOutButton = document.getElementById("sign-out");

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgCjImdw1kE9W1Z1frZ1ER5ue1juU2YFY",
  authDomain: "wishlist-b72b0.firebaseapp.com",
  databaseURL: "https://wishlist-b72b0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wishlist-b72b0",
  appId: "1:313040358232:web:0bc81fdb7ec2080437332d"
};
const FIREBASE_LIST_PATH = "wishlists/my-private-list";
const ALLOWED_EMAIL = "tjn3012@gmail.com";

const bubbles = [];
const MAX_BUBBLES = 100;
let animationStarted = false;
let persistedWishes = [];

let auth = null;
let database = null;
let currentUser = null;

function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.authDomain &&
      FIREBASE_CONFIG.databaseURL &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.appId &&
      ALLOWED_EMAIL.trim()
  );
}

function setWishlistEnabled(enabled) {
  wishlistSection.hidden = !enabled;

  for (const element of form.elements) {
    if ("disabled" in element) {
      element.disabled = !enabled;
    }
  }
}

function setAuthMode(isSignedIn, statusMessage = "") {
  authForm.hidden = isSignedIn;
  signOutButton.hidden = !isSignedIn;

  if (statusMessage) {
    authStatus.textContent = statusMessage;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function updateCounter() {
  if (bubbles.length === 0) {
    counter.textContent = "Chưa có bong bóng nào ✨";
    return;
  }

  counter.textContent = `Đã tạo ${bubbles.length} bong bóng wishlist`;
}

function generateWishId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function normalizeWish(rawWish) {
  if (!rawWish || typeof rawWish !== "object") {
    return null;
  }

  const id = typeof rawWish.id === "string" && rawWish.id.trim() ? rawWish.id.trim() : generateWishId();
  const itemName = String(rawWish.itemName ?? "").trim();
  const itemNote = String(rawWish.itemNote ?? "").trim();
  const itemLevel = rawWish.itemLevel === "love" ? "love" : "medium";
  const parsedCreatedAt = Number(rawWish.createdAt);
  const createdAt = Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now();

  if (!itemName || !itemNote) {
    return null;
  }

  return {
    id,
    itemName,
    itemNote,
    itemLevel,
    createdAt
  };
}

function dedupeAndTrimWishes(rawWishes) {
  const mapById = new Map();

  for (const rawWish of rawWishes) {
    const wish = normalizeWish(rawWish);
    if (!wish) {
      continue;
    }

    mapById.set(wish.id, wish);
  }

  return [...mapById.values()]
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-MAX_BUBBLES);
}

function clearBubbles() {
  for (const bubble of bubbles) {
    bubble.element.remove();
  }

  bubbles.length = 0;
  updateCounter();
}

function spawnBubble(itemName, itemNote, itemLevel) {
  const bubbleElement = document.createElement("article");
  bubbleElement.className = `wish-bubble ${itemLevel === "love" ? "pink" : "blue"}`;

  const title = document.createElement("h3");
  title.textContent = itemName;

  const note = document.createElement("p");
  note.textContent = itemNote;

  bubbleElement.append(title, note);
  bubbleLayer.appendChild(bubbleElement);

  const rect = bubbleElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const x = randomInRange(0, Math.max(1, window.innerWidth - width));
  const y = randomInRange(0, Math.max(1, window.innerHeight - height));

  const velocity = {
    x: randomInRange(28, 75) * (Math.random() < 0.5 ? -1 : 1),
    y: randomInRange(24, 65) * (Math.random() < 0.5 ? -1 : 1)
  };

  const bubble = {
    element: bubbleElement,
    width,
    height,
    x,
    y,
    vx: velocity.x,
    vy: velocity.y,
    floatPhase: randomInRange(0, Math.PI * 2),
    floatAmplitude: randomInRange(4, 12)
  };

  bubbles.push(bubble);

  if (bubbles.length > MAX_BUBBLES) {
    const oldestBubble = bubbles.shift();
    if (oldestBubble) {
      oldestBubble.element.remove();
    }
  }

  updateCounter();
}

function addWish(wish) {
  spawnBubble(wish.itemName, wish.itemNote, wish.itemLevel);

  if (!animationStarted) {
    animateBubbles();
    animationStarted = true;
  }
}

function animateBubbles() {
  let previousTime = performance.now();

  function frame(now) {
    const deltaTime = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    for (const bubble of bubbles) {
      bubble.x += bubble.vx * deltaTime;
      bubble.y += bubble.vy * deltaTime;

      if (bubble.x <= 0 || bubble.x + bubble.width >= window.innerWidth) {
        bubble.vx *= -1;
        bubble.x = clamp(bubble.x, 0, Math.max(0, window.innerWidth - bubble.width));
      }

      if (bubble.y <= 0 || bubble.y + bubble.height >= window.innerHeight) {
        bubble.vy *= -1;
        bubble.y = clamp(bubble.y, 0, Math.max(0, window.innerHeight - bubble.height));
      }

      const bobOffset = Math.sin(now / 900 + bubble.floatPhase) * bubble.floatAmplitude;
      bubble.element.style.transform = `translate(${bubble.x}px, ${bubble.y + bobOffset}px)`;
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

async function loadWishesFromFirebase() {
  try {
    const snapshot = await get(ref(database, FIREBASE_LIST_PATH));
    if (!snapshot.exists()) {
      return [];
    }

    const payload = snapshot.val();
    const items = Array.isArray(payload) ? payload : Object.values(payload);
    return dedupeAndTrimWishes(items);
  } catch (error) {
    console.error("Không thể tải dữ liệu cloud:", error);
    return null;
  }
}

async function saveWishToFirebase(wish) {
  try {
    await push(ref(database, FIREBASE_LIST_PATH), wish);
    return true;
  } catch (error) {
    return false;
  }
}

async function refreshWishlistFromCloud() {
  const firebaseWishes = await loadWishesFromFirebase();
  if (!Array.isArray(firebaseWishes)) {
    counter.textContent = "Không tải được dữ liệu cloud, kiểm tra Firebase cấu hình ⚠️";
    return;
  }

  persistedWishes = firebaseWishes;
  clearBubbles();

  for (const wish of persistedWishes) {
    addWish(wish);
  }

  updateCounter();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    return;
  }

  const formData = new FormData(form);
  const wish = normalizeWish({
    id: generateWishId(),
    itemName: (formData.get("itemName") ?? "").toString(),
    itemNote: (formData.get("itemNote") ?? "").toString(),
    itemLevel: (formData.get("itemLevel") ?? "medium").toString(),
    createdAt: Date.now()
  });

  if (!wish) {
    return;
  }

  const saved = await saveWishToFirebase(wish);
  if (!saved) {
    counter.textContent = "Lưu cloud thất bại, thử lại nhé ⚠️";
    return;
  }

  persistedWishes = dedupeAndTrimWishes([...persistedWishes, wish]);
  addWish(wish);

  form.reset();
  document.getElementById("item-level").value = wish.itemLevel;
  document.getElementById("item-name").focus();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!auth) {
    return;
  }

  const formData = new FormData(authForm);
  const email = (formData.get("email") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();

  if (!email || !password) {
    return;
  }

  authStatus.textContent = "Đang đăng nhập...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authStatus.textContent = "Đăng nhập thất bại, kiểm tra email/mật khẩu ⚠️";
  }
});

signOutButton.addEventListener("click", async () => {
  if (!auth) {
    return;
  }

  await signOut(auth);
});

window.addEventListener("resize", () => {
  for (const bubble of bubbles) {
    bubble.x = clamp(bubble.x, 0, Math.max(0, window.innerWidth - bubble.width));
    bubble.y = clamp(bubble.y, 0, Math.max(0, window.innerHeight - bubble.height));
  }
});

async function bootstrap() {
  setWishlistEnabled(false);
  authForm.hidden = false;
  signOutButton.hidden = true;

  if (!isFirebaseConfigured()) {
    setAuthMode(false, "Thiếu cấu hình Firebase trong script.js ⚠️");
    counter.textContent = "Cần cấu hình Firebase để dùng wishlist";
    return;
  }

  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  database = getDatabase(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      setWishlistEnabled(false);
      setAuthMode(false, "Đăng nhập bằng tài khoản được cấp quyền");
      persistedWishes = [];
      clearBubbles();
      return;
    }

    const allowedEmail = ALLOWED_EMAIL.trim().toLowerCase();
    const signedEmail = (user.email ?? "").toLowerCase();
    if (!allowedEmail || signedEmail !== allowedEmail) {
      setAuthMode(false, "Tài khoản này không có quyền truy cập");
      await signOut(auth);
      return;
    }

    currentUser = user;
    setWishlistEnabled(true);
    setAuthMode(true, `Đã đăng nhập: ${user.email}`);
    await refreshWishlistFromCloud();
  });
}

bootstrap();
