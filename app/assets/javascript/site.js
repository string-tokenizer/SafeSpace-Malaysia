/* site.js - loaded on every page
   Covers: Event Loop demo, Date & Time handling, setInterval, switch statement */

// ===== 1. EVENT LOOP DEMO (open the browser console to see the order) =====
console.log("1. Synchronous code runs first (call stack)");
setTimeout(function () {
  console.log("4. setTimeout callback (macrotask queue) runs last");
}, 0);
Promise.resolve().then(function () {
  console.log("3. Promise.then callback (microtask queue) runs before timers");
});
console.log("2. More synchronous code");

// ===== 2. DATE & TIME =====
const KL = { timeZone: "Asia/Kuala_Lumpur" };

function greetingFor(hour) {
  switch (true) {
    case hour >= 5 && hour < 12:  return "Selamat pagi";
    case hour >= 12 && hour < 15: return "Selamat tengah hari";
    case hour >= 15 && hour < 19: return "Selamat petang";
    default:                      return "Selamat malam";
  }
}

function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;                                   // control statement

  const now = new Date();                            // Date object
  const date = now.toLocaleDateString("en-MY", { ...KL, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("en-MY", { ...KL, hour12: true });
  const hour = Number(now.toLocaleString("en-GB", { ...KL, hour: "2-digit", hourCycle: "h23" }));

  // Output method: innerHTML
  el.innerHTML = greetingFor(hour) + " · " + date + " · <strong>" + time + "</strong> (Kuala Lumpur)";
}

updateClock();
setInterval(updateClock, 1000);                      // Event loop: repeating timer
