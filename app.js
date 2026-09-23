const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const trigger = document.getElementById("range-trigger");
const popover = document.getElementById("range-popover");
const grid = document.getElementById("cal-grid");
const title = document.getElementById("cal-title");
const chipIn = document.getElementById("chip-in");
const chipOut = document.getElementById("chip-out");
const hint = document.getElementById("range-hint");
const summary = document.getElementById("summary-text");
const applyBtn = document.getElementById("apply");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

// Canonical selection (what the grid should represent): Sep 12–18, 2026
const realStart = new Date(2026, 8, 12); // September
const realEnd = new Date(2026, 8, 18);

let viewYear = 2026;
let viewMonth = 8; // September shown in grid/header
let start = new Date(realStart);
let end = new Date(realEnd);
let open = true;

// TRAP source for chips: wrong month formatter offset (+1 month label)
function wrongMonthLabel(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1); // Oct instead of Sep
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

function rightMonthLabel(date) {
  return `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function setOpen(next) {
  open = next;
  popover.classList.toggle("is-open", open);
  trigger.setAttribute("aria-expanded", String(open));

  if (open) {
    // TRAP: every reopen re-inits to "today" and clears the range
    const today = new Date();
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    start = null;
    end = null;
    render();
  }
}

function renderChipsAndHint() {
  // TRAP: chips use wrongMonthLabel while grid/hint use real dates
  if (start && end) {
    chipIn.textContent = `Check-in ${wrongMonthLabel(start)}`;
    chipOut.textContent = `Check-out ${wrongMonthLabel(end)}`;
    hint.textContent = `${rightMonthLabel(start)} – ${rightMonthLabel(end)} · ${daysBetween(start, end)} nights`;
  } else if (start) {
    chipIn.textContent = `Check-in ${wrongMonthLabel(start)}`;
    chipOut.textContent = "Check-out —";
    hint.textContent = "Select check-out";
  } else {
    chipIn.textContent = "Check-in —";
    chipOut.textContent = "Check-out —";
    hint.textContent = "Select check-in";
  }
}

function renderSummaryApplied() {
  if (start && end) {
    summary.textContent = `Stay ${rightMonthLabel(start)} → ${rightMonthLabel(end)} (${daysBetween(start, end)} nights).`;
  } else {
    summary.textContent = "Select dates to see your stay length.";
  }
}

function render() {
  title.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  grid.innerHTML = "";

  const first = new Date(viewYear, viewMonth, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < startPad; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.disabled = true;
    cell.textContent = "";
    grid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day in-month";
    btn.textContent = String(d);
    btn.dataset.iso = date.toISOString();

    if (start && end) {
      if (sameDay(date, start)) btn.classList.add("is-start");
      if (sameDay(date, end)) btn.classList.add("is-end");
      if (date > start && date < end) btn.classList.add("in-range");
    } else if (start && sameDay(date, start)) {
      btn.classList.add("is-start");
    }

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!start || (start && end)) {
        start = date;
        end = null;
      } else if (date < start) {
        start = date;
      } else {
        end = date;
      }
      render();
    });

    grid.appendChild(btn);
  }

  renderChipsAndHint();
}

trigger.addEventListener("click", (event) => {
  event.stopPropagation();
  setOpen(!open);
});

prevBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  render();
});

nextBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  render();
});

applyBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  renderSummaryApplied();
  // Close without going through setOpen(true) reset path
  open = false;
  popover.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#range-popover") && !event.target.closest("#range-trigger")) {
    if (open) {
      open = false;
      popover.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      // Note: outside click does NOT clear state — only setOpen(true) reopen does
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (!open) return;

  if (event.key === "Escape") {
    open = false;
    popover.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
    return;
  }

  // TRAP: Tab dismisses picker instead of moving into days/Apply
  if (event.key === "Tab") {
    open = false;
    popover.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }
});

// Initial: show September grid with Sep 12–18 selected, but chips say October
render();
renderSummaryApplied();
