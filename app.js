const MONTHLY_LIMIT = 100;
const WEEKEND_DAILY_TARGET = 8;
const STORAGE_KEY = "geforce-now-hours-state";

const form = document.querySelector("#settings-form");
const monthInput = document.querySelector("#month-input");
const remainingInput = document.querySelector("#remaining-input");
const startDateInput = document.querySelector("#start-date-input");
const daysTable = document.querySelector("#days-table");
const dayRowTemplate = document.querySelector("#day-row-template");
const resetButton = document.querySelector("#reset-button");
const alertBox = document.querySelector("#alert-box");

const remainingSummary = document.querySelector("#remaining-summary");
const usedSummary = document.querySelector("#used-summary");
const weekdayTargetSummary = document.querySelector("#weekday-target-summary");
const weekendReserveSummary = document.querySelector("#weekend-reserve-summary");

let state = loadState();

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return getTodayIsoDate().slice(0, 7);
}

function getMonthFromDate(isoDate) {
  return isoDate.slice(0, 7);
}

function loadState() {
  const fallback = {
    month: getCurrentMonth(),
    remainingHours: MONTHLY_LIMIT,
    startDate: getTodayIsoDate(),
    playedByDate: {},
  };

  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...fallback, ...storedState, playedByDate: storedState?.playedByDate ?? {} };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseDateAsLocal(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysInPlan(month, startDate) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const lastDay = new Date(year, monthNumber, 0);
  const normalizedStartDate = parseDateAsLocal(startDate);
  const planStart = normalizedStartDate > firstDay ? normalizedStartDate : firstDay;
  const days = [];

  for (let date = new Date(planStart); date <= lastDay; date.setDate(date.getDate() + 1)) {
    const clonedDate = new Date(date);
    days.push({
      date: clonedDate,
      isoDate: toIsoDate(clonedDate),
      isWeekend: [0, 6].includes(clonedDate.getDay()),
    });
  }

  return days;
}

function clampNumber(value, min, max) {
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    return min;
  }
  return Math.min(Math.max(parsedValue, min), max);
}

function roundHours(value) {
  return Math.round(value * 100) / 100;
}

function formatHours(value, suffix = " h") {
  return `${roundHours(value).toLocaleString("es", { maximumFractionDigits: 2 })}${suffix}`;
}

function calculatePlan(days, remainingHours) {
  const weekendDays = days.filter((day) => day.isWeekend).length;
  const weekdayDays = days.length - weekendDays;
  const requestedWeekendReserve = weekendDays * WEEKEND_DAILY_TARGET;
  const weekendReserve = Math.min(remainingHours, requestedWeekendReserve);
  const weekendTarget = weekendDays > 0 ? weekendReserve / weekendDays : 0;
  const weekdayPool = Math.max(remainingHours - weekendReserve, 0);
  const weekdayTarget = weekdayDays > 0 ? weekdayPool / weekdayDays : 0;

  return {
    weekendReserve,
    weekendTarget,
    weekdayTarget,
    plannedByDate: Object.fromEntries(
      days.map((day) => [day.isoDate, day.isWeekend ? weekendTarget : weekdayTarget]),
    ),
  };
}

function getMonthPlayedTotal(month) {
  return Object.entries(state.playedByDate).reduce((total, [isoDate, hours]) => {
    return getMonthFromDate(isoDate) === month ? total + Number(hours) : total;
  }, 0);
}

function getPlanPlayedTotal(days) {
  return days.reduce((total, day) => total + Number(state.playedByDate[day.isoDate] ?? 0), 0);
}

function showAlert(message) {
  alertBox.hidden = !message;
  alertBox.textContent = message;
}

function updateSummaries(days, plan) {
  const playedThisMonth = getMonthPlayedTotal(state.month);
  const realRemaining = state.remainingHours - getPlanPlayedTotal(days);

  remainingSummary.textContent = formatHours(realRemaining);
  usedSummary.textContent = formatHours(playedThisMonth);
  weekdayTargetSummary.textContent = formatHours(plan.weekdayTarget, " h/día");
  weekendReserveSummary.textContent = formatHours(plan.weekendReserve);

  if (realRemaining < 0) {
    showAlert("Has registrado más horas de las que Nvidia indicaba como restantes. Revisa el valor inicial o el registro diario.");
  } else if (plan.weekendTarget > 0 && plan.weekendTarget < WEEKEND_DAILY_TARGET) {
    showAlert("Las horas restantes no cubren todos los fines de semana a 8 h/día. La recomendación de fin de semana se ha reducido de forma proporcional.");
  } else {
    showAlert("");
  }
}

function renderTable(days, plan) {
  daysTable.textContent = "";
  let runningRemaining = state.remainingHours;

  days.forEach((day) => {
    const row = dayRowTemplate.content.firstElementChild.cloneNode(true);
    const playedHours = Number(state.playedByDate[day.isoDate] ?? 0);
    runningRemaining = roundHours(runningRemaining - playedHours);

    row.classList.toggle("weekend", day.isWeekend);
    row.querySelector(".date-cell").textContent = formatDate(day.date);
    row.querySelector(".type-cell").innerHTML = `<span class="type-badge ${day.isWeekend ? "weekend-badge" : ""}">${day.isWeekend ? "Fin de semana" : "Laborable"}</span>`;
    row.querySelector(".plan-cell").textContent = formatHours(plan.plannedByDate[day.isoDate]);

    const playedInput = row.querySelector(".played-input");
    playedInput.value = playedHours || "";
    playedInput.dataset.date = day.isoDate;

    const remainingCell = row.querySelector(".remaining-cell");
    remainingCell.textContent = formatHours(runningRemaining);
    remainingCell.classList.toggle("remaining-negative", runningRemaining < 0);

    daysTable.append(row);
  });
}

function normalizeStartDateForMonth() {
  if (getMonthFromDate(state.startDate) !== state.month) {
    state.startDate = `${state.month}-01`;
  }
}

function render() {
  normalizeStartDateForMonth();
  monthInput.value = state.month;
  remainingInput.value = state.remainingHours;
  startDateInput.value = state.startDate;
  startDateInput.min = `${state.month}-01`;
  startDateInput.max = toIsoDate(new Date(Number(state.month.slice(0, 4)), Number(state.month.slice(5, 7)), 0));

  const days = getDaysInPlan(state.month, state.startDate);
  const plan = calculatePlan(days, state.remainingHours);

  updateSummaries(days, plan);
  renderTable(days, plan);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedMonth = monthInput.value;
  let selectedStartDate = startDateInput.value;

  if (getMonthFromDate(selectedStartDate) !== selectedMonth) {
    selectedStartDate = `${selectedMonth}-01`;
  }

  state = {
    ...state,
    month: selectedMonth,
    remainingHours: clampNumber(remainingInput.value, 0, MONTHLY_LIMIT),
    startDate: selectedStartDate,
  };
  saveState();
  render();
});

daysTable.addEventListener("input", (event) => {
  if (!event.target.matches(".played-input")) {
    return;
  }

  const isoDate = event.target.dataset.date;
  const playedHours = clampNumber(event.target.value, 0, 24);

  if (playedHours === 0) {
    delete state.playedByDate[isoDate];
  } else {
    state.playedByDate[isoDate] = playedHours;
  }

  saveState();
  render();
});

resetButton.addEventListener("click", () => {
  state = {
    month: getCurrentMonth(),
    remainingHours: MONTHLY_LIMIT,
    startDate: getTodayIsoDate(),
    playedByDate: {},
  };
  saveState();
  render();
});

render();
