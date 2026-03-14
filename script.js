import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, get, push, ref } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const form = document.getElementById("wishlist-form");
const wishlistSection = document.getElementById("wishlist-section");
const panelToggleButton = document.getElementById("panel-toggle");
const bubbleLayer = document.getElementById("bubble-layer");
const thanksLayer = document.getElementById("thanks-layer");
const panel = document.querySelector(".panel");
const decorTop = document.querySelector(".decor-top");
const decorBottom = document.querySelector(".decor-bottom");
const counter = document.getElementById("wishlist-count");
const authForm = document.getElementById("auth-form");
const authStatus = document.getElementById("auth-status");
const signOutButton = document.getElementById("sign-out");
const saveWishButton = form ? form.querySelector('button[type="submit"]') : null;

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
const isAndroid = /Android/i.test(navigator.userAgent);
const hasTouchInput = navigator.maxTouchPoints > 0 || window.matchMedia("(hover: none)").matches;
const LOW_POWER_MODE = prefersReducedMotion || hasTouchInput;
const SHOULD_ROUND_POSITIONS = LOW_POWER_MODE && isAndroid;
const TOUCH_SPEED_MULTIPLIER = hasTouchInput && !prefersReducedMotion ? 1.22 : 1;
const ENABLE_BOB = !LOW_POWER_MODE;
const FLOAT_SCALE = isAndroid ? 0.45 : 1;
const MAX_RECURSIVE_SIMULATION_STEPS = LOW_POWER_MODE ? 2 : 5;
const MAX_PHYSICS_STEP_SECONDS = LOW_POWER_MODE ? 1 / 45 : 1 / 90;
const ENABLE_MAGNET = !LOW_POWER_MODE && !isCoarsePointer;
const MAGNET_RADIUS = isAndroid ? 120 : 170;
const MAGNET_MAX_OFFSET = isAndroid ? 5.5 : 9;
const MAGNET_ACTIVITY_WINDOW_MS = 1400;
const IDLE_AFTER_MS = 6500;
const IDLE_VELOCITY_FACTOR = 0.52;
const IDLE_BOB_FACTOR = 0.4;
const COLLISION_GRID_SIZE = LOW_POWER_MODE ? 220 : 180;
const COLLISION_INTERVAL_MS = LOW_POWER_MODE ? 64 : 33;
const COLLISION_MAX_PASSES = LOW_POWER_MODE ? 1 : 2;
const LOD_REFRESH_INTERVAL_MS = LOW_POWER_MODE ? 380 : 220;
const BURST_DURATION_MS = 240;
const COLLISION_NEIGHBOR_OFFSETS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1]
];
const SAVE_THANK_YOU_MESSAGES = [
  "Cảm ơn em đã thêm một điều ước dễ thương nè.",
  "Cảm ơn em, danh sách của mình lại xinh thêm rồi.",
  "Cảm ơn bé yêu, anh lưu lại thật cẩn thận nha.",
  "Yay, cảm ơn em đã chia sẻ điều em thích.",
  "Cảm ơn em nhiều, thêm một chiếc mong muốn đáng yêu.",
  "Cảm ơn công chúa của anh, món này đáng yêu quá.",
  "Cảm ơn em, wishlist của tụi mình lung linh hơn rồi.",
  "Cảm ơn em vì đã tin anh giao nhiệm vụ ghi nhớ này.",
  "Cảm ơn em, anh đã note lại ngay và luôn.",
  "Cảm ơn em bé, một bong bóng xinh vừa được thêm vào.",
  "Cảm ơn em, nhìn danh sách này là thấy vui rồi.",
  "Cảm ơn vợ iu, anh lưu rồi nha.",
  "Cảm ơn em đã nói cho anh biết em thích gì.",
  "Thêm thành công, cảm ơn em yêu nhiều lắm.",
  "Cảm ơn em, món này được ưu tiên trong tim anh.",
  "Cảm ơn bé, anh sẽ nhớ món này thật kỹ.",
  "Cảm ơn em, thêm một gợi ý siêu xinh cho anh.",
  "Cảm ơn em đã làm wishlist dễ thương quá trời.",
  "Cảm ơn em, anh đã cất điều ước này vào mây hồng.",
  "Cảm ơn em yêu, mỗi lần lưu là anh lại cười.",
  "Cảm ơn em, danh sách này càng ngày càng tuyệt.",
  "Cảm ơn em, anh nhận tín hiệu yêu thương rồi đó.",
  "Cảm ơn em, bong bóng mới vừa bay lên xinh quá.",
  "Cảm ơn em đã thêm niềm vui cho ngày hôm nay.",
  "Cảm ơn em, anh đã lưu món em thích ngay tức thì.",
  "Cảm ơn em yêu, wishlist này là kho báu của tụi mình.",
  "Cảm ơn em, một lời nhắc yêu thương vừa được lưu.",
  "Cảm ơn em, món này dễ thương đúng gu của bé.",
  "Cảm ơn em đã click lưu, tim anh cũng click theo.",
  "Cảm ơn em, điều ước này đã về đúng chỗ rồi nha."
];
const THEME_PACKS = [
  {
    name: "dawn",
    fromHour: 5,
    toHour: 9,
    vars: {
      "--pink-1": "#ffe1ee",
      "--pink-2": "#ffb4d6",
      "--blue-1": "#e4f5ff",
      "--blue-2": "#acdfff",
      "--bg-1": "#fff8fd",
      "--bg-2": "#ffeef8",
      "--bg-3": "#ebf7ff",
      "--decor-top-1": "#ffd2ea",
      "--decor-top-2": "#ffe6f3",
      "--decor-bottom-1": "#ccecff",
      "--decor-bottom-2": "#e8f7ff"
    }
  },
  {
    name: "daylight",
    fromHour: 9,
    toHour: 16,
    vars: {
      "--pink-1": "#ffd9ec",
      "--pink-2": "#ff9ecf",
      "--blue-1": "#d8f1ff",
      "--blue-2": "#9fd8ff",
      "--bg-1": "#fff5fb",
      "--bg-2": "#ffe9f4",
      "--bg-3": "#e5f5ff",
      "--decor-top-1": "#ffc5e3",
      "--decor-top-2": "#ffdff0",
      "--decor-bottom-1": "#bde6ff",
      "--decor-bottom-2": "#e2f6ff"
    }
  },
  {
    name: "sunset",
    fromHour: 16,
    toHour: 20,
    vars: {
      "--pink-1": "#ffd4e3",
      "--pink-2": "#ff8fc0",
      "--blue-1": "#d7f0ff",
      "--blue-2": "#95d1ff",
      "--bg-1": "#fff4f7",
      "--bg-2": "#ffe3ef",
      "--bg-3": "#e0f0ff",
      "--decor-top-1": "#ffbbda",
      "--decor-top-2": "#ffd9ea",
      "--decor-bottom-1": "#b0ddff",
      "--decor-bottom-2": "#d8efff"
    }
  },
  {
    name: "night-soft",
    fromHour: 20,
    toHour: 24,
    vars: {
      "--pink-1": "#ffd7ea",
      "--pink-2": "#f7a3cc",
      "--blue-1": "#d9eeff",
      "--blue-2": "#a3d2f5",
      "--bg-1": "#f8f0ff",
      "--bg-2": "#f7e7ff",
      "--bg-3": "#e4efff",
      "--decor-top-1": "#ffc6ea",
      "--decor-top-2": "#efd9ff",
      "--decor-bottom-1": "#b5d8fb",
      "--decor-bottom-2": "#d6e8ff"
    }
  },
  {
    name: "night-soft",
    fromHour: 0,
    toHour: 5,
    vars: {
      "--pink-1": "#ffd7ea",
      "--pink-2": "#f7a3cc",
      "--blue-1": "#d9eeff",
      "--blue-2": "#a3d2f5",
      "--bg-1": "#f8f0ff",
      "--bg-2": "#f7e7ff",
      "--bg-3": "#e4efff",
      "--decor-top-1": "#ffc6ea",
      "--decor-top-2": "#efd9ff",
      "--decor-bottom-1": "#b5d8fb",
      "--decor-bottom-2": "#d6e8ff"
    }
  }
];

const bubbles = [];
const MAX_BUBBLES = prefersReducedMotion ? 20 : LOW_POWER_MODE ? 20 : 100;
let bubbleAnimationFrameId = 0;
let previousBubbleFrameTime = 0;
let frameRemainderMs = 0;
let collisionAccumulatorMs = 0;
let lodRefreshAccumulatorMs = 0;
let persistedWishes = [];
let panelCollapsed = false;
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let themeClockId = 0;
let lastInteractionAtMs = performance.now();
let velocityActivityFactor = 1;
let bobActivityFactor = 1;
let pointerX = viewportWidth * 0.5;
let pointerY = viewportHeight * 0.5;
let pointerLastActiveMs = 0;
let lastThankYouMessageIndex = -1;

let auth = null;
let database = null;
let currentUser = null;

function updateViewportSize() {
  viewportWidth = Math.max(1, window.innerWidth);
  viewportHeight = Math.max(1, window.innerHeight);
}

function setPanelCollapsed(collapsed, shouldFocusInput = false) {
  if (!panel || !panelToggleButton) {
    return;
  }

  panelCollapsed = collapsed;
  panel.classList.toggle("panel-collapsed", collapsed);
  panelToggleButton.textContent = collapsed ? "+" : "-";
  panelToggleButton.setAttribute("aria-expanded", String(!collapsed));
  panelToggleButton.setAttribute(
    "aria-label",
    collapsed ? "Mở bảng wishlist" : "Thu nhỏ bảng wishlist"
  );

  if (collapsed) {
    panel.style.transform = "";
  }

  if (shouldFocusInput && !collapsed) {
    document.getElementById("item-name")?.focus();
  }
}

if (panelToggleButton) {
  const togglePanel = () => {
    setPanelCollapsed(!panelCollapsed, true);
  };

  panelToggleButton.addEventListener("click", togglePanel);

  // Some mobile browsers may miss click synthesis on transformed layers.
  panelToggleButton.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      togglePanel();
    },
    { passive: false }
  );
}

function initParallax() {
  if (!bubbleLayer || !panel || !decorTop || !decorBottom) {
    return;
  }

  if (LOW_POWER_MODE) {
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
    const x = (clientX / viewportWidth - 0.5) * 2;
    const y = (clientY / viewportHeight - 0.5) * 2;
    state.targetX = clamp(x, -1, 1);
    state.targetY = clamp(y, -1, 1);

    if (!isCoarsePointer) {
      document.body.style.setProperty("--cursor-x", `${clientX}px`);
      document.body.style.setProperty("--cursor-y", `${clientY}px`);
    }

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
    if (panelCollapsed) {
      panel.style.transform = "";
    } else {
      panel.style.transform = `translate3d(${state.currentX * depth.panelX}px, ${state.currentY * depth.panelY}px, 0) rotateX(${state.currentY * -depth.rotateX}deg) rotateY(${state.currentX * depth.rotateY}deg)`;
    }

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

  if (window.PointerEvent) {
    document.addEventListener("pointermove", onPointerMove, { passive: true });
  } else {
    document.addEventListener("mousemove", onPointerMove, { passive: true });
  }

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

    // Android browsers generally allow this immediately.
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
      enableOrientation();
    }
  }

  const resetParallax = () => {
    state.targetX = 0;
    state.targetY = 0;
    if (!isCoarsePointer) {
      document.body.style.setProperty("--cursor-x", "50%");
      document.body.style.setProperty("--cursor-y", "50%");
    }
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

function pickRandomThankYouMessage() {
  if (SAVE_THANK_YOU_MESSAGES.length === 0) {
    return "Cảm ơn em yêu";
  }

  let index = Math.floor(Math.random() * SAVE_THANK_YOU_MESSAGES.length);
  if (SAVE_THANK_YOU_MESSAGES.length > 1 && index === lastThankYouMessageIndex) {
    index = (index + 1 + Math.floor(Math.random() * (SAVE_THANK_YOU_MESSAGES.length - 1))) % SAVE_THANK_YOU_MESSAGES.length;
  }

  lastThankYouMessageIndex = index;
  return SAVE_THANK_YOU_MESSAGES[index];
}

function showRandomSaveThanksToast(clientX, clientY) {
  if (!thanksLayer || !saveWishButton || wishlistSection.hidden) {
    return;
  }

  const buttonRect = saveWishButton.getBoundingClientRect();
  const anchorX = Number.isFinite(clientX) ? clientX : buttonRect.left + buttonRect.width * 0.5;
  const anchorY = Number.isFinite(clientY) ? clientY : buttonRect.top + buttonRect.height * 0.5;
  const toastX = clamp(anchorX + randomInRange(-18, 18), 24, viewportWidth - 24);
  const toastY = clamp(anchorY + randomInRange(-4, 8), 52, viewportHeight - 24);

  const toast = document.createElement("p");
  toast.className = "save-thanks-toast";
  toast.textContent = pickRandomThankYouMessage();
  toast.style.left = `${toastX}px`;
  toast.style.top = `${toastY}px`;

  thanksLayer.appendChild(toast);

  while (thanksLayer.childElementCount > 6) {
    thanksLayer.firstElementChild?.remove();
  }

  toast.addEventListener(
    "animationend",
    () => {
      toast.remove();
    },
    { once: true }
  );
}

function initSaveThanksFeedback() {
  if (!saveWishButton) {
    return;
  }

  saveWishButton.addEventListener("click", (event) => {
    showRandomSaveThanksToast(event.clientX, event.clientY);
  });
}

function getBubbleTextDensityClass(itemName, itemNote) {
  const densityScore = itemName.length * 1.1 + itemNote.length * 0.95;
  if (densityScore >= 132) {
    return "ultra-compact";
  }

  if (densityScore >= 96) {
    return "compact";
  }

  return "";
}

function getThemePackForHour(hour) {
  for (const pack of THEME_PACKS) {
    if (hour >= pack.fromHour && hour < pack.toHour) {
      return pack;
    }
  }

  return THEME_PACKS[1];
}

function applyThemePackByTime(currentDate = new Date()) {
  const rootStyle = document.documentElement.style;
  const themePack = getThemePackForHour(currentDate.getHours());
  for (const [cssVar, value] of Object.entries(themePack.vars)) {
    rootStyle.setProperty(cssVar, value);
  }

  document.body.dataset.theme = themePack.name;
}

function startThemeClock() {
  applyThemePackByTime();
  if (themeClockId) {
    clearInterval(themeClockId);
  }

  themeClockId = window.setInterval(() => {
    applyThemePackByTime();
  }, 5 * 60 * 1000);
}

function markInteraction(clientX, clientY) {
  const now = performance.now();
  lastInteractionAtMs = now;

  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    pointerX = clamp(clientX, 0, viewportWidth);
    pointerY = clamp(clientY, 0, viewportHeight);
    pointerLastActiveMs = now;
  }
}

function initInteractionTracking() {
  const handlePointerMove = (event) => {
    markInteraction(event.clientX, event.clientY);
  };

  if (window.PointerEvent) {
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
  } else {
    document.addEventListener("mousemove", handlePointerMove, { passive: true });
  }

  document.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      markInteraction(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      markInteraction(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "wheel",
    () => {
      markInteraction();
    },
    { passive: true }
  );

  window.addEventListener("keydown", () => {
    markInteraction();
  });
}

function updateActivityFactors(now) {
  const idle = now - lastInteractionAtMs > IDLE_AFTER_MS;
  const targetVelocityFactor = idle ? IDLE_VELOCITY_FACTOR : 1;
  const targetBobFactor = idle ? IDLE_BOB_FACTOR : 1;
  velocityActivityFactor += (targetVelocityFactor - velocityActivityFactor) * 0.09;
  bobActivityFactor += (targetBobFactor - bobActivityFactor) * 0.09;
}

function getMagnetOffset(bubble, now) {
  if (!ENABLE_MAGNET || now - pointerLastActiveMs > MAGNET_ACTIVITY_WINDOW_MS) {
    return { x: 0, y: 0 };
  }

  const centerX = bubble.x + bubble.width * 0.5;
  const centerY = bubble.y + bubble.height * 0.5;
  const deltaX = pointerX - centerX;
  const deltaY = pointerY - centerY;
  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const magnetRadiusSquared = MAGNET_RADIUS * MAGNET_RADIUS;
  if (distanceSquared === 0 || distanceSquared > magnetRadiusSquared) {
    return { x: 0, y: 0 };
  }

  const distance = Math.sqrt(distanceSquared);
  const normalizedDistance = 1 - distance / MAGNET_RADIUS;
  const offsetStrength = normalizedDistance * normalizedDistance * MAGNET_MAX_OFFSET * velocityActivityFactor;
  return {
    x: (deltaX / distance) * offsetStrength,
    y: (deltaY / distance) * offsetStrength
  };
}

function refreshBubbleLod() {
  const centerX = viewportWidth * 0.5;
  const centerY = viewportHeight * 0.5;
  const invHalfWidth = 1 / Math.max(1, centerX);
  const invHalfHeight = 1 / Math.max(1, centerY);

  for (const bubble of bubbles) {
    const bubbleCenterX = bubble.x + bubble.width * 0.5;
    const bubbleCenterY = bubble.y + bubble.height * 0.5;
    const normalizedX = (bubbleCenterX - centerX) * invHalfWidth;
    const normalizedY = (bubbleCenterY - centerY) * invHalfHeight;
    const radialDistance = Math.hypot(normalizedX, normalizedY);

    let lodLevel = 0;
    if (radialDistance > 0.96) {
      lodLevel = 2;
    } else if (radialDistance > 0.68) {
      lodLevel = 1;
    }

    if (LOW_POWER_MODE && lodLevel === 0 && bubbles.length > 12) {
      lodLevel = 1;
    }

    if (bubble.lodLevel !== lodLevel) {
      bubble.lodLevel = lodLevel;
      bubble.element.dataset.lod = String(lodLevel);
    }
  }
}

function resolveBubblePairCollision(leftBubble, rightBubble) {
  const leftCenterX = leftBubble.x + leftBubble.width * 0.5;
  const leftCenterY = leftBubble.y + leftBubble.height * 0.5;
  const rightCenterX = rightBubble.x + rightBubble.width * 0.5;
  const rightCenterY = rightBubble.y + rightBubble.height * 0.5;
  const deltaX = rightCenterX - leftCenterX;
  const deltaY = rightCenterY - leftCenterY;
  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const minDistance = leftBubble.collisionRadius + rightBubble.collisionRadius;
  const minDistanceSquared = minDistance * minDistance;

  if (distanceSquared === 0 || distanceSquared >= minDistanceSquared) {
    return;
  }

  const distance = Math.sqrt(distanceSquared);
  const normalX = deltaX / distance;
  const normalY = deltaY / distance;
  const overlap = minDistance - distance;
  const separationX = normalX * overlap * 0.5;
  const separationY = normalY * overlap * 0.5;

  leftBubble.x = clamp(leftBubble.x - separationX, 0, leftBubble.maxX);
  leftBubble.y = clamp(leftBubble.y - separationY, 0, leftBubble.maxY);
  rightBubble.x = clamp(rightBubble.x + separationX, 0, rightBubble.maxX);
  rightBubble.y = clamp(rightBubble.y + separationY, 0, rightBubble.maxY);

  const relativeVelocity = (rightBubble.vx - leftBubble.vx) * normalX + (rightBubble.vy - leftBubble.vy) * normalY;
  if (relativeVelocity >= 0) {
    return;
  }

  const impulse = Math.min(36, -relativeVelocity) * 0.42;
  leftBubble.vx -= normalX * impulse;
  leftBubble.vy -= normalY * impulse;
  rightBubble.vx += normalX * impulse;
  rightBubble.vy += normalY * impulse;
}

function resolveBubbleCollisionsWithGrid() {
  if (bubbles.length < 2) {
    return;
  }

  const spatialGrid = new Map();
  for (const bubble of bubbles) {
    const centerX = bubble.x + bubble.width * 0.5;
    const centerY = bubble.y + bubble.height * 0.5;
    const cellX = Math.floor(centerX / COLLISION_GRID_SIZE);
    const cellY = Math.floor(centerY / COLLISION_GRID_SIZE);
    const cellKey = `${cellX},${cellY}`;
    const cellItems = spatialGrid.get(cellKey);
    if (cellItems) {
      cellItems.push(bubble);
      continue;
    }

    spatialGrid.set(cellKey, [bubble]);
  }

  for (const [cellKey, cellBubbles] of spatialGrid) {
    const separatorIndex = cellKey.indexOf(",");
    const baseX = Number(cellKey.slice(0, separatorIndex));
    const baseY = Number(cellKey.slice(separatorIndex + 1));

    for (const [offsetX, offsetY] of COLLISION_NEIGHBOR_OFFSETS) {
      const neighborKey = `${baseX + offsetX},${baseY + offsetY}`;
      const neighborBubbles = spatialGrid.get(neighborKey);
      if (!neighborBubbles) {
        continue;
      }

      if (offsetX === 0 && offsetY === 0) {
        for (let i = 0; i < cellBubbles.length; i += 1) {
          for (let j = i + 1; j < cellBubbles.length; j += 1) {
            resolveBubblePairCollision(cellBubbles[i], cellBubbles[j]);
          }
        }
        continue;
      }

      for (const leftBubble of cellBubbles) {
        for (const rightBubble of neighborBubbles) {
          resolveBubblePairCollision(leftBubble, rightBubble);
        }
      }
    }
  }
}

function getFrameProfileByBubbleCount(bubbleCount) {
  if (prefersReducedMotion) {
    return {
      name: "reduced",
      intervalMs: 1000 / 20
    };
  }

  if (LOW_POWER_MODE) {
    if (bubbleCount <= 6) {
      return {
        name: "eco-high",
        intervalMs: 1000 / 45
      };
    }

    if (bubbleCount <= 12) {
      return {
        name: "eco-balanced",
        intervalMs: 1000 / 30
      };
    }

    return {
      name: "eco-stable",
      intervalMs: 1000 / 20
    };
  }

  if (bubbleCount <= 6) {
    return {
      name: "ultra",
      intervalMs: 1000 / 120
    };
  }

  if (bubbleCount <= 14) {
    return {
      name: "high",
      intervalMs: 1000 / 90
    };
  }

  if (bubbleCount <= 28) {
    return {
      name: "balanced",
      intervalMs: 1000 / 60
    };
  }

  if (bubbleCount <= 52) {
    return {
      name: "smooth",
      intervalMs: 1000 / 45
    };
  }

  if (bubbleCount <= 80) {
    return {
      name: "stable",
      intervalMs: 1000 / 30
    };
  }

  return {
    name: "dense",
    intervalMs: 1000 / 20
  };
}

function syncBubbleBounds(bubble) {
  bubble.maxX = Math.max(0, viewportWidth - bubble.width);
  bubble.maxY = Math.max(0, viewportHeight - bubble.height);
  bubble.x = clamp(bubble.x, 0, bubble.maxX);
  bubble.y = clamp(bubble.y, 0, bubble.maxY);
}

function applyBubblePhysicsStep(stepSeconds) {
  const effectiveStepSeconds = stepSeconds * velocityActivityFactor;
  for (const bubble of bubbles) {
    bubble.x += bubble.vx * effectiveStepSeconds;
    bubble.y += bubble.vy * effectiveStepSeconds;

    if (bubble.maxX > 0 && (bubble.x <= 0 || bubble.x >= bubble.maxX)) {
      bubble.vx *= -1;
      bubble.x = clamp(bubble.x, 0, bubble.maxX);
    }

    if (bubble.maxY > 0 && (bubble.y <= 0 || bubble.y >= bubble.maxY)) {
      bubble.vy *= -1;
      bubble.y = clamp(bubble.y, 0, bubble.maxY);
    }
  }
}

function simulateBubblesRecursive(remainingSeconds, depth = 0) {
  if (remainingSeconds <= 0 || depth >= MAX_RECURSIVE_SIMULATION_STEPS) {
    return;
  }

  const stepSeconds = Math.min(remainingSeconds, MAX_PHYSICS_STEP_SECONDS);
  applyBubblePhysicsStep(stepSeconds);
  simulateBubblesRecursive(remainingSeconds - stepSeconds, depth + 1);
}

function renderBubbles(now) {
  for (const bubble of bubbles) {
    const bobOffset =
      bubble.floatAmplitude > 0 ? Math.sin(now / 900 + bubble.floatPhase) * bubble.floatAmplitude * bobActivityFactor : 0;
    const magnetOffset = getMagnetOffset(bubble, now);

    const burstProgress = clamp((now - bubble.spawnedAtMs) / BURST_DURATION_MS, 0, 1);
    const burstEase = 1 - (1 - burstProgress) * (1 - burstProgress);
    const burstScale = 0.88 + burstEase * 0.12;
    const burstLift = (1 - burstEase) * -7;

    const renderX = SHOULD_ROUND_POSITIONS ? Math.round(bubble.x + magnetOffset.x) : bubble.x + magnetOffset.x;
    const renderY = SHOULD_ROUND_POSITIONS
      ? Math.round(bubble.y + bobOffset + magnetOffset.y + burstLift)
      : bubble.y + bobOffset + magnetOffset.y + burstLift;
    const renderScale = Number(burstScale.toFixed(3));

    if (renderX === bubble.renderX && renderY === bubble.renderY && renderScale === bubble.renderScale) {
      continue;
    }

    bubble.renderX = renderX;
    bubble.renderY = renderY;
    bubble.renderScale = renderScale;
    bubble.element.style.transform = `translate3d(${renderX}px, ${renderY}px, 0) scale(${renderScale})`;
  }
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
  const textDensityClass = getBubbleTextDensityClass(itemName, itemNote);
  if (textDensityClass) {
    bubbleElement.classList.add(textDensityClass);
  }
  bubbleElement.classList.add("burst-in");

  const title = document.createElement("h3");
  title.textContent = itemName;

  const note = document.createElement("p");
  note.textContent = itemNote;

  bubbleElement.append(title, note);
  bubbleLayer.appendChild(bubbleElement);

  const rect = bubbleElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const x = randomInRange(0, Math.max(1, viewportWidth - width));
  const y = randomInRange(0, Math.max(1, viewportHeight - height));

  const velocity = {
    x:
      randomInRange(isCoarsePointer ? 12 : 28, isCoarsePointer ? 34 : 75) *
      TOUCH_SPEED_MULTIPLIER *
      (Math.random() < 0.5 ? -1 : 1),
    y:
      randomInRange(isCoarsePointer ? 10 : 24, isCoarsePointer ? 30 : 65) *
      TOUCH_SPEED_MULTIPLIER *
      (Math.random() < 0.5 ? -1 : 1)
  };

  const bubble = {
    element: bubbleElement,
    width,
    height,
    x,
    y,
    maxX: 0,
    maxY: 0,
    collisionRadius: Math.max(30, Math.min(width, height) * 0.42),
    vx: velocity.x,
    vy: velocity.y,
    floatPhase: randomInRange(0, Math.PI * 2),
    floatAmplitude: ENABLE_BOB
      ? randomInRange(isCoarsePointer ? 1.5 : 4, isCoarsePointer ? 4.5 : 12) * FLOAT_SCALE
      : 0,
    spawnedAtMs: performance.now(),
    lodLevel: -1,
    renderX: Number.NaN,
    renderY: Number.NaN,
    renderScale: Number.NaN
  };

  syncBubbleBounds(bubble);

  bubbles.push(bubble);

  if (bubbles.length > MAX_BUBBLES) {
    const oldestBubble = bubbles.shift();
    if (oldestBubble) {
      oldestBubble.element.remove();
    }
  }

  refreshBubbleLod();

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
  frameRemainderMs = 0;
  collisionAccumulatorMs = 0;
  lodRefreshAccumulatorMs = 0;
  bubbleAnimationFrameId = requestAnimationFrame(animateBubblesFrame);
}

function stopBubbleAnimation() {
  if (!bubbleAnimationFrameId) {
    return;
  }

  cancelAnimationFrame(bubbleAnimationFrameId);
  bubbleAnimationFrameId = 0;
  frameRemainderMs = 0;
  collisionAccumulatorMs = 0;
  lodRefreshAccumulatorMs = 0;
}

function animateBubblesFrame(now) {
  if (document.hidden || bubbles.length === 0) {
    bubbleAnimationFrameId = 0;
    frameRemainderMs = 0;
    collisionAccumulatorMs = 0;
    lodRefreshAccumulatorMs = 0;
    return;
  }

  const elapsedMs = now - previousBubbleFrameTime;
  previousBubbleFrameTime = now;
  updateActivityFactors(now);

  const frameProfile = getFrameProfileByBubbleCount(bubbles.length);
  const cappedElapsedMs = Math.min(elapsedMs, 120);
  frameRemainderMs += cappedElapsedMs;
  if (frameRemainderMs < frameProfile.intervalMs) {
    bubbleAnimationFrameId = requestAnimationFrame(animateBubblesFrame);
    return;
  }

  const processedMs = frameRemainderMs;
  frameRemainderMs = frameRemainderMs % frameProfile.intervalMs;

  const simulationSeconds = Math.min(processedMs / 1000, MAX_PHYSICS_STEP_SECONDS * MAX_RECURSIVE_SIMULATION_STEPS);
  simulateBubblesRecursive(simulationSeconds);

  collisionAccumulatorMs += processedMs;
  if (collisionAccumulatorMs >= COLLISION_INTERVAL_MS) {
    const collisionPasses = Math.min(COLLISION_MAX_PASSES, Math.floor(collisionAccumulatorMs / COLLISION_INTERVAL_MS));
    for (let pass = 0; pass < collisionPasses; pass += 1) {
      resolveBubbleCollisionsWithGrid();
    }
    collisionAccumulatorMs -= collisionPasses * COLLISION_INTERVAL_MS;
  }

  lodRefreshAccumulatorMs += processedMs;
  if (lodRefreshAccumulatorMs >= LOD_REFRESH_INTERVAL_MS) {
    refreshBubbleLod();
    lodRefreshAccumulatorMs = lodRefreshAccumulatorMs % LOD_REFRESH_INTERVAL_MS;
  }

  renderBubbles(now);

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
  updateViewportSize();
  pointerX = clamp(pointerX, 0, viewportWidth);
  pointerY = clamp(pointerY, 0, viewportHeight);

  for (const bubble of bubbles) {
    syncBubbleBounds(bubble);
  }

  refreshBubbleLod();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateViewportSize, { passive: true });
}

async function bootstrap() {
  updateViewportSize();
  startThemeClock();
  document.body.classList.toggle("coarse-pointer", isCoarsePointer);
  document.body.classList.toggle("low-power", LOW_POWER_MODE);

  initInteractionTracking();
  initSaveThanksFeedback();
  initParallax();
  setPanelCollapsed(false);

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
      setPanelCollapsed(false);
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
    setPanelCollapsed(false);
    setAuthMode(true, `Đã đăng nhập: ${user.email}`);
    await refreshWishlistFromCloud();
  });
}

bootstrap();
