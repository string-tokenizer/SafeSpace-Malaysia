/* safety_check.js - only on /safety-check
   Output methods: innerHTML, window.alert(), console, document.write()
   Also: operators, control statements, async/await + timers (event loop), Date handling */
(function () {
  "use strict";

  const form = document.getElementById("checkForm");
  if (!form) return;

  const resultBox = document.getElementById("result");
  const errorBox  = document.getElementById("formErrors");
  const dateInput = document.getElementById("checkDate");
  const lastInput = document.getElementById("lastIncident");

  let checksDone = 0;       // counts submissions in this visit
  let lastReport = null;    // remembers the latest result for the printable summary

  // ---------- helpers ----------
  const pad   = (n) => String(n).padStart(2, "0");
  const toISO = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));   // promise + timer
  const esc   = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function setDates() {
    const todayISO = toISO(new Date());
    dateInput.value = todayISO;
    dateInput.max = todayISO;
    lastInput.max = todayISO;
  }
  setDates();

  // ---------- validation (control statements + regex) ----------
  function validate() {
    const errors = [];
    const nickname = form.nickname.value.trim();

    if (!/^[A-Za-z\s'.-]{0,30}$/.test(nickname)) {
      errors.push("Nickname may only contain letters, spaces and . ' -");
    }
    if (form.role.value === "") {
      errors.push("Please choose who you are answering for.");
    }
    if (lastInput.value !== "" && lastInput.value > toISO(new Date())) {
      errors.push("The incident date cannot be in the future.");
    }
    if (!form.understand.checked) {
      errors.push("Please tick the confirmation box.");
    }
    return errors;
  }

  // ---------- assessment (operators + control flow) ----------
  function assess() {
    const boxes = Array.from(form.querySelectorAll('input[name="signs"]'));
    const picked = boxes.filter((b) => b.checked)
                        .map((b) => ({ label: b.dataset.label, weight: Number(b.value) }));

    let score = 0;
    for (let i = 0; i < picked.length; i++) {
      score += picked[i].weight;                                   // assignment operator
    }
    const maxScore = boxes.reduce((sum, b) => sum + Number(b.value), 0);
    const percent  = Math.round((score / maxScore) * 100);         // arithmetic operators
    const severe   = picked.some((p) => p.weight === 3);           // threats, sexual or physical harm

    let level;
    if (score === 0) {
      level = { key: "none", text: "No warning signs selected", css: "success" };
    } else if (severe || score >= 9) {                             // logical OR
      level = { key: "high", text: "High concern", css: "danger" };
    } else if (score >= 4) {
      level = { key: "moderate", text: "Moderate concern", css: "warning" };
    } else {
      level = { key: "low", text: "Some warning signs", css: "info" };
    }

    // Date handling: whole days between two calendar dates
    let sinceText = "";
    if (lastInput.value) {
      const days = Math.floor((new Date(toISO(new Date())) - new Date(lastInput.value)) / 86400000);
      sinceText = days === 0 ? "today" : days === 1 ? "1 day ago" : days + " days ago";   // ternary operator
    }

    const name = form.nickname.value.trim() || "Friend";
    const roleLabel = { myself: "yourself", friend: "your friend", family: "your family member" }[form.role.value];
    const stamp = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });

    return { name, roleLabel, picked, score, maxScore, percent, level, sinceText, stamp };
  }

  // ---------- pop-up dialog content ----------
  function helpHTML(key) {
    switch (key) {
      case "high":
        return '<p class="fw-semibold">If you or someone is in danger right now, call <a href="tel:999">999</a>.</p>' +
               '<ul><li>Talian Kasih: <a href="tel:15999">15999</a></li>' +
               '<li>WAO: <a href="tel:+60330008858">03-3000 8858</a></li></ul>' +
               '<p class="mb-0">You can ask the police or JKM about a Protection Order.</p>';
      case "moderate":
        return '<p>These signs matter. Talking to a trained person can help you plan next steps.</p>' +
               '<ul><li>WAO: <a href="tel:+60330008858">03-3000 8858</a></li>' +
               '<li>AWAM Telenita: <a href="tel:+60379561214">03-7956 1214</a></li></ul>';
      case "low":
        return '<p>Some behaviours listed can grow into abuse. Learn the signs and keep a trusted contact.</p>' +
               '<p class="mb-0">Read more on the <a href="/what-is">What Is</a> page.</p>';
      default:
        return '<p class="mb-0">No warning signs selected. If something still feels wrong, trust that feeling and reach out. Helplines are on the <a href="/hotline">Hotline</a> page.</p>';
    }
  }

  function showModal(level) {
    document.getElementById("helpTitle").textContent = level.text;
    document.getElementById("helpBody").innerHTML = helpHTML(level.key);       // innerHTML
    bootstrap.Modal.getOrCreateInstance(document.getElementById("helpModal")).show();
  }

  // ---------- Output method 1: innerHTML ----------
  function renderResult(r) {
    const items = r.picked.length
      ? r.picked.map((p) => "<li>" + esc(p.label) + " <span class='text-muted'>(weight " + p.weight + ")</span></li>").join("")
      : "<li>None selected</li>";

    resultBox.innerHTML =
      '<div class="card border-0 shadow-sm p-4 mb-4">' +
        '<h2 class="mb-1">' + esc(r.level.text) + '</h2>' +
        '<p class="text-muted">Result for ' + esc(r.name) + ', answering for ' + esc(r.roleLabel) + ' · ' + esc(r.stamp) + '</p>' +
        '<div class="progress mb-3" role="progressbar" aria-valuenow="' + r.percent + '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="progress-bar bg-' + r.level.css + '" style="width:' + r.percent + '%">' + r.percent + '%</div>' +
        '</div>' +
        '<p>Score: <strong>' + r.score + '</strong> out of ' + r.maxScore +
        (r.sinceText ? ' · Most recent incident: <strong>' + esc(r.sinceText) + '</strong>' : '') + '</p>' +
        '<ul>' + items + '</ul>' +
        '<p class="small text-muted">Checks completed in this visit: ' + checksDone + '</p>' +
        '<div class="d-flex gap-2 flex-wrap">' +
          '<button type="button" class="btn btn-rose rounded-pill" id="helpBtn">Show help options</button>' +
          '<button type="button" class="btn btn-outline-rose rounded-pill" id="printBtn">Open printable summary</button>' +
        '</div>' +
      '</div>';
  }

  // ---------- Output method 4: document.write() into a NEW window ----------
  function openReport() {
    if (!lastReport) return;
    const r = lastReport;
    const w = window.open("", "_blank", "width=720,height=800");
    if (!w) {
      window.alert("Your browser blocked the pop-up. Please allow pop-ups for this site and try again.");
      return;
    }
    w.document.open();
    w.document.write(
      "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Safety check summary</title>" +
      "<style>body{font-family:Georgia,serif;max-width:640px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#3b3340}" +
      "h1{margin-bottom:0}small{color:#7b7283}</style></head><body>" +
      "<h1>Safe Space Malaysia</h1><small>Safety check summary · " + esc(r.stamp) + "</small>" +
      "<h2>" + esc(r.level.text) + "</h2>" +
      "<p>Prepared for " + esc(r.name) + " (answering for " + esc(r.roleLabel) + ")</p>" +
      "<p>Score: " + r.score + " / " + r.maxScore + " (" + r.percent + "%)</p>" +
      "<ul>" + r.picked.map((p) => "<li>" + esc(p.label) + "</li>").join("") + "</ul>" +
      "<p><strong>Emergency: 999</strong><br>Talian Kasih: 15999<br>WAO: 03-3000 8858</p>" +
      "<p><small>This is not a diagnosis or legal advice.</small></p>" +
      "<button onclick='window.print()'>Print</button></body></html>"
    );
    w.document.close();
  }

  // ---------- submit handler (async/await = event loop) ----------
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorBox.innerHTML = "";

    const errors = validate();
    if (errors.length > 0) {
      console.error("Validation failed:", errors);                               // Output method: console
      errorBox.innerHTML = '<div class="alert alert-danger"><ul class="mb-0">' +
        errors.map((e) => "<li>" + esc(e) + "</li>").join("") + "</ul></div>";
      window.alert("Please fix the following:\n- " + errors.join("\n- "));       // Output method: window.alert()
      return;
    }

    resultBox.innerHTML = '<div class="alert alert-secondary">Analysing your answers…</div>';
    console.log("Before await: the page stays responsive while we wait");
    await delay(1000);                                                           // timer + promise
    console.log("After await: continuing in a later turn of the event loop");

    checksDone++;                                                                // increment operator
    const r = assess();
    lastReport = r;

    renderResult(r);                                                             // innerHTML

    console.group("Safety check #" + checksDone);                                // console
    console.table(r.picked);
    console.log("Score:", r.score, "/", r.maxScore, "=", r.percent + "%");
    console.log("Level:", r.level.key);
    if (r.level.key === "high") console.warn("High concern: recommend hotline information");
    console.groupEnd();

    window.alert(                                                                // window.alert()
      "Hi " + r.name + ",\nResult: " + r.level.text + "\nScore: " + r.score + "/" + r.maxScore +
      "\nIf you are in danger, call 999."
    );

    showModal(r.level);                                                          // pop-up dialog
  });

  // ---------- buttons inside the result (event delegation) ----------
  resultBox.addEventListener("click", function (e) {
    if (e.target.closest("#printBtn")) openReport();
    if (e.target.closest("#helpBtn") && lastReport) showModal(lastReport.level);
  });

  // ---------- reset ----------
  form.addEventListener("reset", function () {
    // the browser resets fields AFTER this event, so wait one turn of the event loop
    setTimeout(function () {
      setDates();
      resultBox.innerHTML = "";
      errorBox.innerHTML = "";
      console.log("Form cleared");
    }, 0);
  });
})();
