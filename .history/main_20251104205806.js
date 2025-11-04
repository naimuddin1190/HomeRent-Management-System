/* main.js
   রুম ম্যানেজমেন্ট, ক্যালকুলেশন, localStorage, প্রিন্ট, প্রগ্রেস চার্ট
*/

// LocalStorage Keys
const ROOMS_KEY = "roomsData";     // array of room objects
// room object: { id, name, rent, prev_read, curr_read, units, elecBill, totalBill }

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const addRoomBtn = document.getElementById("addRoomBtn");
  const saveAllBtn = document.getElementById("saveAllBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const roomContainer = document.getElementById("roomContainer");
  const printSummaryBtn = document.getElementById("printSummaryBtn");

  const totalRoomsEl = document.getElementById("totalRooms");
  const totalRentEl = document.getElementById("totalRent");
  const totalElecEl = document.getElementById("totalElec");
  const grandTotalEl = document.getElementById("grandTotal");
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");

  // load rooms from localStorage or init empty
  let rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];

  // Chart.js setup
  const ctx = document.getElementById("progressChart").getContext("2d");
  let progressChart = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "মোট ভাড়া (টাকা)", data: [], backgroundColor: "rgba(79,70,229,0.8)" },
      { label: "মোট বিদ্যুৎ (টাকা)", data: [], backgroundColor: "rgba(6,182,212,0.85)" }
    ]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  // Helper: save rooms
  function saveRooms() {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }

  // Helper: generate unique id
  function uid() { return 'r' + Date.now() + Math.floor(Math.random()*1000); }

  // Add new room
  addRoomBtn.addEventListener("click", () => {
    const id = uid();
    rooms.push({ id, name: `রুম ${rooms.length + 1}`, rent: 0, prev_read: 0, curr_read: 0, units: 0, elecBill: 0, totalBill: 0 });
    saveRooms();
    renderRooms();
    notifyRoomsChanged();
  });

  // Save all (explicit)
  saveAllBtn.addEventListener("click", () => {
    saveRooms();
    alert("সকল রুম সেভ করা হয়েছে।");
    renderRooms();
    notifyRoomsChanged();
  });

  // Clear all
  clearAllBtn.addEventListener("click", () => {
    if (!confirm("আপনি কি নিশ্চিত সমস্ত ডেটা মুছে ফেলতে চান?")) return;
    localStorage.removeItem(ROOMS_KEY);
    rooms = [];
    renderRooms();
    updateSummary();
    notifyRoomsChanged();
  });

  // Print summary (open print window with formatted content)
  printSummaryBtn.addEventListener("click", () => {
    const printHtml = buildPrintHtml();
    const w = window.open("", "_blank", "width=900,height=600");
    w.document.write(printHtml);
    w.document.close();
    w.focus();
    w.print();
  });

  // Build print HTML for summary
  function buildPrintHtml() {
    const today = new Date().toLocaleString('bn-BD');
    let rows = "";
    rooms.forEach((r, i) => {
      rows += `<tr>
        <td style="padding:6px;border:1px solid #ddd">${i+1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.name)}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.rent}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.prev_read}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.curr_read}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.units}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.elecBill}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.totalBill}</td>
      </tr>`;
    });

    const summary = `
      <div style="font-family:Arial, Helvetica, sans-serif; padding:20px;">
        <h2 style="margin:0 0 6px 0">বাংলা — মাসিক বিল রিপোর্ট</h2>
        <div style="color:#666;margin-bottom:12px">তারিখ: ${today}</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ddd">#</th>
              <th style="padding:6px;border:1px solid #ddd">রুম</th>
              <th style="padding:6px;border:1px solid #ddd">ভাড়া (টাকা)</th>
              <th style="padding:6px;border:1px solid #ddd">পূর্বের রিডিং</th>
              <th style="padding:6px;border:1px solid #ddd">বর্তমান রিডিং</th>
              <th style="padding:6px;border:1px solid #ddd">ইউনিট</th>
              <th style="padding:6px;border:1px solid #ddd">বিদ্যুৎ বিল</th>
              <th style="padding:6px;border:1px solid #ddd">মোট বিল</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:12px;font-weight:700">মোট রুম: ${rooms.length} — মোট বিল: ${calcGrandTotal()}</div>
      </div>`;
    return summary;
  }

  // Escape HTML for safety
  function escapeHtml(str){ if(str==null) return ""; return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

  // Render rooms to DOM
  function renderRooms() {
    roomContainer.innerHTML = "";
    rooms.forEach((r, idx) => {
      const card = document.createElement("div");
      card.className = "room-card";
      card.innerHTML = `
        <div class="room-top">
          <div class="room-title">
            <input type="text" class="room-name" data-id="${r.id}" value="${escapeHtml(r.name)}" />
          </div>
          <div class="room-controls">
            <button class="btn outline btn-print" data-id="${r.id}"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
            <button class="btn danger btn-delete" data-id="${r.id}"><i class="fa-solid fa-trash"></i> মুছুন</button>
          </div>
        </div>

        <div class="room-fields">
          <label>ভাড়া (টাকা)<input type="number" class="room-rent" data-id="${r.id}" value="${r.rent}"></label>
          <label>পূর্বের মাসের রিডিং<input type="number" class="room-prev" data-id="${r.id}" value="${r.prev_read}"></label>
          <label>বর্তমান মাসের রিডিং<input type="number" class="room-curr" data-id="${r.id}" value="${r.curr_read}"></label>
          <label>ইউনিট (curr - prev)<input type="number" class="room-units" data-id="${r.id}" value="${r.units}" readonly></label>
        </div>

        <div class="card-actions">
          <button class="btn primary btn-calc" data-id="${r.id}"><i class="fa-solid fa-calculator"></i> ক্যালকুলেট করুন</button>
        </div>

        <div class="result-block" id="result-${r.id}">
          <div>বিদ্যুৎ বিল: <strong class="elec-val">${r.elecBill}</strong> টাকা</div>
          <div>মোট বিল: <strong class="total-val">${r.totalBill}</strong> টাকা</div>
        </div>
      `;
      roomContainer.appendChild(card);
    });

    // Attach event listeners (delegated style)
    attachRoomListeners();
    updateSummary();
    updateChart();
  }

  // Attach listeners for dynamic elements
  function attachRoomListeners(){
    // name change
    roomContainer.querySelectorAll(".room-name").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        const r = rooms.find(x => x.id === id);
        if(r) { r.name = e.target.value; saveRooms(); notifyRoomsChanged(); renderRooms(); }
      });
    });

    // rent change
    roomContainer.querySelectorAll(".room-rent").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const id = e.target.dataset.id;
        const r = rooms.find(x => x.id === id);
        if(r) { r.rent = Number(e.target.value || 0); saveRooms(); updateSummary(); updateChart(); }
      });
    });

    // prev/curr change
    roomContainer.querySelectorAll(".room-prev").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const id = e.target.dataset.id;
        const r = rooms.find(x => x.id === id);
        if(r) { r.prev_read = Number(e.target.value || 0); saveRooms(); }
      });
    });
    roomContainer.querySelectorAll(".room-curr").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const id = e.target.dataset.id;
        const r = rooms.find(x => x.id === id);
        if(r) { r.curr_read = Number(e.target.value || 0); saveRooms(); }
      });
    });

    // calc buttons
    roomContainer.querySelectorAll(".btn-calc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest("button").dataset.id;
        calculateRoom(id);
      });
    });

    // delete buttons
    roomContainer.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest("button").dataset.id;
        if(!confirm("এই রুমটি মুছে ফেলতে চান?")) return;
        rooms = rooms.filter(x => x.id !== id);
        saveRooms(); renderRooms(); notifyRoomsChanged();
      });
    });

    // print per room
    roomContainer.querySelectorAll(".btn-print").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.closest("button").dataset.id;
        printRoom(id);
      });
    });
  }

  // Calculate a room's units & bills
  function calculateRoom(id) {
    const r = rooms.find(x => x.id === id);
    if(!r) return;
    // units = curr - prev (if negative -> 0)
    const units = Number(r.curr_read || 0) - Number(r.prev_read || 0);
    r.units = units > 0 ? units : 0;
    r.elecBill = r.units * 10;         // unit price 10
    r.totalBill = Number(r.rent || 0) + Number(r.elecBill || 0);
    saveRooms();
    renderRooms();
  }

  // Calculate totals for summary
  function calcTotalRent() { return rooms.reduce((s,r)=> s + Number(r.rent || 0), 0); }
  function calcTotalElec() { return rooms.reduce((s,r)=> s + Number(r.elecBill || 0), 0); }
  function calcGrandTotal() { return calcTotalRent() + calcTotalElec(); }

  // Update summary cards
  function updateSummary() {
    totalRoomsEl.textContent = rooms.length;
    totalRentEl.textContent = calcTotalRent();
    totalElecEl.textContent = calcTotalElec();
    grandTotalEl.textContent = calcGrandTotal();

    // progress percent: a room is 'complete' if totalBill > 0
    const completed = rooms.filter(r => Number(r.totalBill || 0) > 0).length;
    const percent = rooms.length ? Math.round((completed / rooms.length) * 100) : 0;
    progressFill.style.width = percent + "%";
    progressPercent.textContent = percent + "%";
  }

  // Update Chart
  function updateChart() {
    const labels = rooms.map(r => r.name || r.id);
    const rentData = rooms.map(r => Number(r.rent || 0));
    const elecData = rooms.map(r => Number(r.elecBill || 0));
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = rentData;
    progressChart.data.datasets[1].data = elecData;
    progressChart.update();
  }

  // Print single room
  function printRoom(id) {
    const r = rooms.find(x => x.id === id);
    if(!r) return alert("রুম পাওয়া যায়নি।");
    const html = `
      <div style="font-family:Arial;padding:18px">
        <h2>রুম রিপোর্ট — ${escapeHtml(r.name)}</h2>
        <p>ভাড়া: ${r.rent} টাকা</p>
        <p>পূর্ববর্তী রিডিং: ${r.prev_read}</p>
        <p>বর্তমান রিডিং: ${r.curr_read}</p>
        <p>ইউনিট: ${r.units}</p>
        <p>বিদ্যুৎ বিল: ${r.elecBill} টাকা</p>
        <p style="font-weight:700">মোট বিল: ${r.totalBill} টাকা</p>
      </div>
    `;
    const w = window.open("", "_blank", "width=600,height=600");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  // Utility: when rooms change, notify tenant page to refresh its room dropdown via localStorage event
  function notifyRoomsChanged() {
    // just update a timestamp key so other tabs/files can listen if needed
    localStorage.setItem("roomsUpdatedAt", Date.now());
  }

  // Bind refresh chart button
  document.getElementById("refreshChartBtn").addEventListener("click", () => updateChart());

  // Initial render
  renderRooms();

  // Expose minimal API for tenant.js to access rooms
  window.__ROOMS_API = {
    getRooms: () => rooms,
    onRoomsChanged: (cb) => {
      window.addEventListener("storage", (e) => {
        if(e.key === "roomsUpdatedAt") cb();
      });
    },
    refresh: () => { rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms; renderRooms(); }
  };
});
