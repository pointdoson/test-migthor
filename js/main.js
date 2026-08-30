// ============================================================
// Configuración de la vaquinha — EDITA ESTOS VALORES
// ============================================================
const CAMPAIGN = {
  raised: 4017,     // cantidad recaudada actual (£)
  goal: 5000,       // objetivo total (£)
  title: "Help Thor get his scoliosis surgery",
  url: window.location.href.replace(/donar\.html.*$/, "") || window.location.href
};

// ============================================================
// Moneda según el país del visitante (solo visual — Hotmart ya
// cobra en la moneda local real del comprador). Se detecta vía
// /api/geo (función serverless en Vercel, gratis y sin límites).
// ============================================================
const CURRENCY_BY_COUNTRY = {
  GB: { symbol: "£", suffix: "", isoCode: "GBP" },
  IE: { symbol: "€", suffix: "", isoCode: "EUR" },
  ES: { symbol: "€", suffix: "", isoCode: "EUR" },
  US: { symbol: "$", suffix: " USD", isoCode: "USD" },
  CA: { symbol: "$", suffix: " CAD", isoCode: "CAD" },
  AU: { symbol: "$", suffix: " AUD", isoCode: "AUD" }
};
const DEFAULT_CURRENCY = { symbol: "£", suffix: "", isoCode: "GBP" };
let ACTIVE_CURRENCY = DEFAULT_CURRENCY;

// ============================================================
// Utilidades
// ============================================================
function formatCurrency(n) {
  return ACTIVE_CURRENCY.symbol + n.toLocaleString("en-GB") + ACTIVE_CURRENCY.suffix;
}

function formatGoalShort(n) {
  return ACTIVE_CURRENCY.symbol + Math.round(n / 1000) + "k" + ACTIVE_CURRENCY.suffix;
}

// Actualiza los textos de meta ("raised of £5k", "£5,000" en la historia, etc.)
function refreshGoalTexts() {
  const goalShort = formatGoalShort(CAMPAIGN.goal);

  const goalText = document.getElementById("goalText");
  if (goalText) goalText.textContent = "raised of " + goalShort;

  const summaryGoalText = document.getElementById("summaryGoalText");
  if (summaryGoalText) summaryGoalText.textContent = "of " + goalShort + " raised";

  document.querySelectorAll(".goal-amount-full").forEach((el) => {
    el.textContent = formatCurrency(CAMPAIGN.goal);
  });
}

// Actualiza las etiquetas de los botones de importe en donar.html
function refreshAmountLabels() {
  document.querySelectorAll(".amount-chip[data-amount]").forEach((btn) => {
    const amt = parseFloat(btn.dataset.amount);
    const formatted = Number.isInteger(amt) ? amt.toString() : amt.toFixed(2);
    btn.textContent = ACTIVE_CURRENCY.symbol + formatted + ACTIVE_CURRENCY.suffix;
  });
}

// Detecta el país del visitante y aplica la moneda correspondiente.
async function initCurrencyByCountry() {
  // Modo de prueba: ?debugCountry=CA fuerza el país sin depender de VPN
  // ni de la función serverless. Ejemplos: ?debugCountry=US, =AU, =IE, =GB
  const debugCountry = new URLSearchParams(window.location.search).get("debugCountry");

  if (debugCountry) {
    const match = CURRENCY_BY_COUNTRY[debugCountry.toUpperCase()];
    if (match) ACTIVE_CURRENCY = match;
  } else {
    try {
      const res = await fetch("/api/geo");
      const data = await res.json();
      const match = CURRENCY_BY_COUNTRY[data.country];
      if (match) ACTIVE_CURRENCY = match;
    } catch (e) {
      // si falla la detección, se queda con la moneda por defecto (£)
    }
  }

  initDonut();
  initSummaryBar();
  refreshGoalTexts();
  refreshAmountLabels();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function shareCampaign() {
  const shareData = {
    title: CAMPAIGN.title,
    text: CAMPAIGN.title + " — every contribution counts 🥑",
    url: window.location.origin + window.location.pathname.replace(/donar\.html$/, "index.html")
  };
  if (navigator.share) {
    try { await navigator.share(shareData); }
    catch (e) { /* usuario canceló, no hacemos nada */ }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Link copied 📋");
  }
}

// ============================================================
// Donut de progreso (páginas con #donutValue)
// ============================================================
function initDonut() {
  const donut = document.getElementById("donutValue");
  const label = document.getElementById("donutLabel");
  if (!donut) return;

  const pct = Math.max(0, Math.min(100, Math.round((CAMPAIGN.raised / CAMPAIGN.goal) * 100)));
  const circumference = 2 * Math.PI * 18; // r=18
  const value = (pct / 100) * circumference;

  requestAnimationFrame(() => {
    donut.style.strokeDasharray = `${value} ${circumference}`;
  });
  if (label) label.textContent = pct + "%";

  const raisedEl = document.getElementById("raisedAmount");
  if (raisedEl) raisedEl.textContent = formatCurrency(CAMPAIGN.raised);

  const stickyRaised = document.getElementById("stickyRaised");
  if (stickyRaised) stickyRaised.textContent = formatCurrency(CAMPAIGN.raised);

  const stickyPercent = document.getElementById("stickyPercent");
  if (stickyPercent) stickyPercent.textContent = pct + "%";
}

// ============================================================
// Resumen con barra simple (donar.html)
// ============================================================
function initSummaryBar() {
  const bar = document.getElementById("summaryBar");
  if (!bar) return;
  const pct = Math.max(0, Math.min(100, Math.round((CAMPAIGN.raised / CAMPAIGN.goal) * 100)));
  requestAnimationFrame(() => { bar.style.width = pct + "%"; });

  const raisedEl = document.getElementById("summaryRaised");
  if (raisedEl) raisedEl.textContent = formatCurrency(CAMPAIGN.raised);
}

// ============================================================
// Carrusel del hero (index.html)
// ============================================================
function initHeroCarousel() {
  const track = document.getElementById("heroTrack");
  const dotsWrap = document.getElementById("heroDots");
  if (!track || !dotsWrap) return;

  const slides = Array.from(track.children);
  if (slides.length <= 1) return;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  let current = 0;
  let startX = 0;
  let dragging = false;

  function goTo(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
  }

  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    dragging = true;
    track.style.transition = "none";
  }, { passive: true });

  track.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    track.style.transform = `translateX(calc(-${current * 100}% + ${dx}px))`;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    dragging = false;
    track.style.transition = "";
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -50) goTo(current + 1);
    else if (dx > 50) goTo(current - 1);
    else goTo(current);
  });

  // Autoplay suave
  setInterval(() => goTo((current + 1) % slides.length), 6000);
}

// ============================================================
// Donaciones: feed que "llega" fila a fila al entrar en pantalla
// ============================================================
function initDonationsFeed() {
  const list = document.getElementById("donationsList");
  if (!list) return;

  // Revela filas una a una, como si fueran llegando donaciones.
  function revealRows(rows) {
    rows.forEach((row, i) => {
      row.style.display = "flex";
      setTimeout(() => {
        row.classList.add("is-visible");
      }, i * 140);
    });
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        revealRows(Array.from(list.querySelectorAll(".donation-row:not(.extra)")));
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );
  observer.observe(list);

  const verMasBtn = document.getElementById("verMasDonaciones");
  if (!verMasBtn) return;

  let expanded = false;
  verMasBtn.addEventListener("click", () => {
    expanded = !expanded;
    const extraRows = Array.from(list.querySelectorAll(".donation-row.extra"));

    if (expanded) {
      revealRows(extraRows);
      verMasBtn.textContent = "See less";
    } else {
      extraRows.forEach((row) => {
        row.classList.remove("is-visible");
        row.style.display = "none";
      });
      verMasBtn.textContent = "See more donations";
      list.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

// ============================================================
// Barra fija inferior: aparece al salir del hero
// ============================================================
function initStickyBar() {
  const bar = document.getElementById("stickyBar");
  const hero = document.getElementById("hero");
  if (!bar || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => bar.classList.toggle("visible", !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(hero);
}

// ============================================================
// Botones de compartir
// ============================================================
function initShareButtons() {
  ["shareBtnTop", "shareBtnSticky"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", shareCampaign);
  });
}

// ============================================================
// Página donar.html: elegir importe → redirigir al link de pago
// ============================================================
function initDonarPage() {
  const grid = document.getElementById("amountGrid");
  if (!grid) return; // no estamos en donar.html

  const chips = Array.from(grid.querySelectorAll(".amount-chip"));
  const continueBtn = document.getElementById("continueBtn");

  let selectedAmount = null;
  let selectedLink = null;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedAmount = parseFloat(chip.dataset.amount);
      selectedLink = chip.dataset.link;
      continueBtn.disabled = false;
    });
  });

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      if (!selectedAmount || !selectedLink) return;

      if (typeof fbq === "function") {
        fbq("track", "InitiateCheckout", {
          value: selectedAmount,
          currency: ACTIVE_CURRENCY.isoCode,
          content_name: "Donation for Thor"
        });
      }

      // Pequeño margen para que el Pixel alcance a enviar el evento antes de salir de la página.
      setTimeout(() => {
        window.location.href = selectedLink;
      }, 250);
    });
  }
}

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initDonut();
  initSummaryBar();
  initCurrencyByCountry();
  initDonationsFeed();
  initHeroCarousel();
  initStickyBar();
  initShareButtons();
  initDonarPage();
});
