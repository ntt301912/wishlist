import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, get, push, ref } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const form = document.getElementById("wishlist-form");
const wishlistSection = document.getElementById("wishlist-section");
const bubbleLayer = document.getElementById("bubble-layer");
const panel = document.querySelector(".panel");
const decorTop = document.querySelector(".decor-top");
const decorBottom = document.querySelector(".decor-bottom");
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
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const bubbles = [];
const MAX_BUBBLES = prefersReducedMotion ? 36 : isCoarsePointer ? 54 : 100;
let bubbleAnimationFrameId = 0;
let previousBubbleFrameTime = 0;
let persistedWishes = [];

let auth = null;
let database = null;
let currentUser = null;

function initParallax() {
  if (!bubbleLayer || !panel || !decorTop || !decorBottom) {
    return;
  }

  if (prefersReducedMotion) {
    return;
  }

  const depth = isCoarsePointer
    ? {
        bubbleX: 11,
        bubbleY: 8,
        decorTopX: 16,
        decorTopY: 12,
        decorBottomX: -14,
        decorBottomY: -10,
        panelX: -3,
        panelY: -3,
        rotateX: 1.2,
        rotateY: 1.6
      }
    : {
        bubbleX: 34,
        bubbleY: 22,
        decorTopX: 54,
        decorTopY: 38,
        decorBottomX: -48,
        decorBottomY: -34,
        panelX: -12,
        panelY: -10,
        rotateX: 3.8,
        rotateY: 5.4
      };

  const state = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    rafId: 0
  };

  function normalizePoint(clientX, clientY) {
    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;
    state.targetX = clamp(x, -1, 1);
    state.targetY = clamp(y, -1, 1);
    document.body.style.setProperty("--cursor-x", `${clientX}px`);
    document.body.style.setProperty("--cursor-y", `${clientY}px`);

    if (!state.rafId) {
      state.rafId = requestAnimationFrame(applyParallax);
    }
  }

  function applyParallax() {
    if (document.hidden) {
      state.rafId = 0;
      return;
    }

    const ease = 0.14;
    state.currentX += (state.targetX - state.currentX) * ease;
    state.currentY += (state.targetY - state.currentY) * ease;

    bubbleLayer.style.transform = `translate3d(${state.currentX * depth.bubbleX}px, ${state.currentY * depth.bubbleY}px, 0)`;
    decorTop.style.transform = `translate3d(${state.currentX * depth.decorTopX}px, ${state.currentY * depth.decorTopY}px, 0)`;
    decorBottom.style.transform = `translate3d(${state.currentX * depth.decorBottomX}px, ${state.currentY * depth.decorBottomY}px, 0)`;
    panel.style.transform = `translate3d(${state.currentX * depth.panelX}px, ${state.currentY * depth.panelY}px, 0) rotateX(${state.currentY * -depth.rotateX}deg) rotateY(${state.currentX * depth.rotateY}deg)`;

    const closeEnoughX = Math.abs(state.targetX - state.currentX) < 0.001;
    const closeEnoughY = Math.abs(state.targetY - state.currentY) < 0.001;
    if (closeEnoughX && closeEnoughY) {
      state.rafId = 0;
      return;
    }

    state.rafId = requestAnimationFrame(applyParallax);
  }

  const onPointerMove = (event) => {
    normalizePoint(event.clientX, event.clientY);
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("mousemove", onPointerMove, { passive: true });

  if (isCoarsePointer) {
    let orientationEnabled = false;

    const onTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      normalizePoint(touch.clientX, touch.clientY);
    };

    document.addEventListener("touchmove", onTouchMove, { passive: true });

    const onDeviceOrientation = (event) => {
      if (!Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) {
        return;
      }

      const x = clamp(event.gamma / 24, -1, 1);
      const y = clamp(event.beta / 32, -1, 1);
      state.targetX = x;
      state.targetY = y;

      const px = ((x + 1) / 2) * 100;
      const py = ((y + 1) / 2) * 100;
      document.body.style.setProperty("--cursor-x", `${px}%`);
      document.body.style.setProperty("--cursor-y", `${py}%`);

      if (!state.rafId) {
        state.rafId = requestAnimationFrame(applyParallax);
      }
    };

    const enableOrientation = async () => {
      if (orientationEnabled) {
        return;
      }

      try {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") {
            return;
          }
        }

        window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });
        orientationEnabled = true;
      } catch (error) {
        // Orientation permission may be denied on some devices.
      }
    };

    enableOrientation();
    document.addEventListener("touchstart", enableOrientation, { passive: true, once: true });
  }

  const resetParallax = () => {
    state.targetX = 0;
    state.targetY = 0;
    document.body.style.setProperty("--cursor-x", "50%");
    document.body.style.setProperty("--cursor-y", "50%");
    if (!state.rafId) {
      state.rafId = requestAnimationFrame(applyParallax);
    }
  };

  document.addEventListener("mouseleave", resetParallax);
  window.addEventListener("pointercancel", resetParallax);
  window.addEventListener("touchcancel", resetParallax, { passive: true });
  window.addEventListener("touchend", resetParallax, { passive: true });
  window.addEventListener("blur", resetParallax);
  document.addEventListener("visibilitychange", resetParallax);
}

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
  const itemLink = String(rawWish.itemLink ?? "").trim();
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
    itemLink,
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
  stopBubbleAnimation();
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
    x: randomInRange(isCoarsePointer ? 22 : 28, isCoarsePointer ? 56 : 75) * (Math.random() < 0.5 ? -1 : 1),
    y: randomInRange(isCoarsePointer ? 18 : 24, isCoarsePointer ? 48 : 65) * (Math.random() < 0.5 ? -1 : 1)
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
    floatAmplitude: randomInRange(isCoarsePointer ? 3 : 4, isCoarsePointer ? 8 : 12)
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
  startBubbleAnimation();
}

function startBubbleAnimation() {
  if (bubbleAnimationFrameId || bubbles.length === 0 || document.hidden) {
    return;
  }

  previousBubbleFrameTime = performance.now();
  bubbleAnimationFrameId = requestAnimationFrame(animateBubblesFrame);
}

function stopBubbleAnimation() {
  if (!bubbleAnimationFrameId) {
    return;
  }

  cancelAnimationFrame(bubbleAnimationFrameId);
  bubbleAnimationFrameId = 0;
}

function animateBubblesFrame(now) {
  if (document.hidden || bubbles.length === 0) {
    bubbleAnimationFrameId = 0;
    return;
  }

  const deltaTime = Math.min((now - previousBubbleFrameTime) / 1000, 0.05);
  previousBubbleFrameTime = now;

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
    bubble.element.style.transform = `translate3d(${bubble.x}px, ${bubble.y + bobOffset}px, 0)`;
  }

  bubbleAnimationFrameId = requestAnimationFrame(animateBubblesFrame);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopBubbleAnimation();
    return;
  }

  startBubbleAnimation();
});

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
    itemLink: (formData.get("itemLink") ?? "").toString(),
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
  initParallax();

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
