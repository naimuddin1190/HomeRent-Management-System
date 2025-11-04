/* main.js
   Rooms, calculations, Paid/Due tracking, auto-date, print summary, Chart.js
*/

const ROOMS_KEY = "roomsData"; // stores array of room objects

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

  // load data
  let rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];

  // Chart
  const ctx = document.getElementById("progressChart").getContext("2d");
  let progressChart = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "ভাড়া", data: [], backgroundColor: "rgba(79,70,229,0.8)" },
      { label: "বিদ্যুৎ", data: [], backgroundColor: "rgba(6,182,212,0.85)" }
    ]},
    options: { responsive: true, maintainAspectRatio: false, scales:{ y:{ beginAtZero:true } } }
  });

  // helpers
  function uid(){ return 'r'+Date.now()+Math.floor(Math.random()*1000); }
  function saveRooms(){ localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)); localStorage.setItem("roomsUpdatedAt", Date.now()); }
  function escapeHtml(s){ if(s==null) return ""; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // add room
  addRoomBtn.addEventListener("click", () => {
    const id = uid();
    const newRoom = {
      id, name: `রুম ${rooms.length + 1}`, rent: 0,
      prev_read: 0, curr_read: 0, units: 0, elecBill: 0, totalBill: 0,
      status: "due", paidDate: "", tenantId: "" // tenantId can link to tenant profile
    };
    rooms.push(newRoom);
    saveRooms();
    renderRooms();
    updateSummary();
  });

  // save all
  saveAllBtn.addEventListener("click", () => { saveRooms(); alert("সকল রুম সেভ করা হয়েছে।"); });

  // clear all
  clearAllBtn.addEventListener("click", () => {
    if(!confirm("আপনি কি নিশ্চিত সমস্ত রুম ডেটা মুছতে চান?")) return;
    localStorage.removeItem(ROOMS_KEY);
    rooms = [];
    renderRooms();
    updateSummary();
  });

  // print summary
  printSummaryBtn.addEventListener("click", () => {
    const html = buildPrintHtml();
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  });

  function buildPrintHtml(){
    const today = new Date().toLocaleString('bn-BD');
    let rows = "";
    rooms.forEach((r,i)=>{
      rows += `<tr>
        <td style="padding:6px;border:1px solid #ddd">${i+1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.name)}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.rent}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.prev_read}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.curr_read}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.units}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.elecBill}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.totalBill}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.status === 'paid' ? 'Paid — '+(r.paidDate || '') : 'Due'}</td>
      </tr>`;
    });
    const header = `<div style="font-family:Arial;padding:18px">
      <h2 style="margin:0 0 6px 0">বাংলা হোম রেন্ট রিপোর্ট</h2>
      <div style="color:#666;margin-bottom:12px">তারিখ: ${today}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr>
          <th style="padding:6px;border:1px solid #ddd">#</th>
          <th style="padding:6px;border:1px solid #ddd">রুম</th>
          <th style="padding:6px;border:1px solid #ddd">ভাড়া</th>
          <th style="padding:6px;border:1px solid #ddd">পূর্ব</th>
          <th style="padding:6px;border:1px solid #ddd">বর্তমান</th>
          <th style="padding:6px;border:1px solid #ddd">ইউনিট</th>
          <th style="padding:6px;border:1px solid #ddd">বিদ্যুৎ বিল</th>
          <th style="padding:6px;border:1px solid #ddd">মোট</th>
          <th style="padding:6px;border:1px solid #ddd">স্ট্যাটাস</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:12px;font-weight:700">মোট রুম: ${rooms.length} — সর্বমোট: ${calcGrandTotal()}</div>
    </div>`;
    return header;
  }

  // render rooms
  function renderRooms(){
    roomContainer.innerHTML = "";
    rooms.forEach(r => {
      const div = document.createElement("div");
      div.className = "room-card " + (r.status === "paid" ? "room-paid" : "room-due");
      div.innerHTML = `
        <div class="room-top">
          <div class="room-title"><input type="text" class="room-name" data-id="${r.id}" value="${escapeHtml(r.name)}"></div>
          <div class="room-controls">
            <button class="btn outline btn-print" data-id="${r.id}"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
            <button class="btn danger btn-delete" data-id="${r.id}"><i class="fa-solid fa-trash"></i> মুছুন</button>
          </div>
        </div>

        <div class="room-fields">
          <label>ভাড়া (টাকা)<input type="number" class="room-rent" data-id="${r.id}" value="${r.rent}"></label>
          <label>পূর্বের রিডিং<input type="number" class="room-prev" data-id="${r.id}" value="${r.prev_read}"></label>
          <label>বর্তমান রিডিং<input type="number" class="room-curr" data-id="${r.id}" value="${r.curr_read}"></label>
          <label>ইউনিট<input type="number" class="room-units" data-id="${r.id}" value="${r.units}" readonly></label>
        </div>

        <div class="card-actions">
          <button class="btn primary btn-calc" data-id="${r.id}"><i class="fa-solid fa-calculator"></i> ক্যালকুলেট</button>
          <button class="btn" data-id="${r.id}" class="payBtn" onclick="void(0)"></button>
        </div>

        <div class="result-block" id="result-${r.id}">
          <div>বিদ্যুৎ বিল: <strong class="elec-val">${r.elecBill}</strong> টাকা</div>
          <div>মোট বিল: <strong class="total-val">${r.totalBill}</strong> টাকা</div>
          <div>স্ট্যাটাস: <strong class="status-val">${r.status === 'paid' ? 'পরিশোধিত — '+(r.paidDate||'') : 'বাকি'}</strong></div>
        </div>

        <div style="margin-top:8px">
          <button class="btn primary btn-paid" data-id="${r.id}">${r.status === 'paid' ? 'Paid রিসেট' : 'Paid করুন'}</button>
          <button class="btn danger btn-due" data-id="${r.id}">Due সেট করুন</button>
        </div>
      `;
      roomContainer.appendChild(div);
    });
    attachListeners();
    updateSummary();
    updateChart();
  }

  // attach dynamic listeners
  function attachListeners(){
    // name change
    roomContainer.querySelectorAll(".room-name").forEach(inp=>{
      inp.addEventListener("change",(e)=>{
        const id = e.target.dataset.id; const r = rooms.find(x=>x.id===id);
        if(r){ r.name = e.target.value; saveRooms(); renderRooms(); }
      });
    });
    // rent change
    roomContainer.querySelectorAll(".room-rent").forEach(inp=>{
      inp.addEventListener("input",(e)=>{
        const id = e.target.dataset.id; const r = rooms.find(x=>x.id===id);
        if(r){ r.rent = Number(e.target.value||0); saveRooms(); updateSummary(); updateChart(); }
      });
    });
    // prev/curr
    roomContainer.querySelectorAll(".room-prev").forEach(inp=>{
      inp.addEventListener("input",(e)=>{
        const id = e.target.dataset.id; const r = rooms.find(x=>x.id===id);
        if(r){ r.prev_read = Number(e.target.value||0); saveRooms(); }
      });
    });
    roomContainer.querySelectorAll(".room-curr").forEach(inp=>{
      inp.addEventListener("input",(e)=>{
        const id = e.target.dataset.id; const r = rooms.find(x=>x.id===id);
        if(r){ r.curr_read = Number(e.target.value||0); saveRooms(); }
      });
    });
    // calc
    roomContainer.querySelectorAll(".btn-calc").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        const id = e.currentTarget.dataset.id; calculateRoom(id);
      });
    });
    // delete
    roomContainer.querySelectorAll(".btn-delete").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        const id = e.currentTarget.dataset.id;
        if(!confirm("এই রুমটি মুছে ফেলবেন?")) return;
        rooms = rooms.filter(x=>x.id!==id);
        saveRooms(); renderRooms();
      });
    });
    // print per room
    roomContainer.querySelectorAll(".btn-print").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        const id = e.currentTarget.dataset.id; printRoom(id);
      });
    });
    // paid
    roomContainer.querySelectorAll(".btn-paid").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        const id = e.currentTarget.dataset.id; togglePaid(id);
      });
    });
    // due
    roomContainer.querySelectorAll(".btn-due").forEach(btn=>{
      btn.addEventListener("click",(e)=>{
        const id = e.currentTarget.dataset.id; setDue(id);
      });
    });
  }

  // calculation
  function calculateRoom(id){
    const r = rooms.find(x=>x.id===id); if(!r) return;
    const units = Number(r.curr_read||0) - Number(r.prev_read||0);
    r.units = units > 0 ? units : 0;
    r.elecBill = r.units * 10;
    r.totalBill = Number(r.rent||0) + Number(r.elecBill||0);
    saveRooms(); renderRooms();
  }

  // paid toggle: if unpaid -> mark paid & set date; if paid -> reset to due
  function togglePaid(id){
    const r = rooms.find(x=>x.id===id); if(!r) return;
    if(r.status === 'paid'){
      // reset to due
      if(!confirm("Paid রিসেট করে Due করবেন?")) return;
      r.status = 'due'; r.paidDate = "";
    } else {
      r.status = 'paid';
      r.paidDate = new Date().toLocaleDateString('bn-BD');
    }
    saveRooms(); renderRooms();
  }

  // set due explicitly (keeps paidDate if any)
  function setDue(id){
    const r = rooms.find(x=>x.id===id); if(!r) return;
    r.status = 'due';
    saveRooms(); renderRooms();
  }

  // summary calculations
  function calcTotalRent(){ return rooms.reduce((s,r)=> s + Number(r.rent||0), 0); }
  function calcTotalElec(){ return rooms.reduce((s,r)=> s + Number(r.elecBill||0), 0); }
  function calcGrandTotal(){ return calcTotalRent() + calcTotalElec(); }

  // update summary
  function updateSummary(){
    totalRoomsEl.textContent = rooms.length;
    totalRentEl.textContent = calcTotalRent();
    totalElecEl.textContent = calcTotalElec();
    grandTotalEl.textContent = calcGrandTotal();

    const paidCount = rooms.filter(r=> r.status === 'paid').length;
    const percent = rooms.length ? Math.round((paidCount/rooms.length)*100) : 0;
    progressFill.style.width = percent + "%";
    progressPercent.textContent = percent + "%";
  }

  // update chart
  function updateChart(){
    const labels = rooms.map(r=> r.name || r.id);
    const rentData = rooms.map(r=> Number(r.rent || 0));
    const elecData = rooms.map(r=> Number(r.elecBill || 0));
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = rentData;
    progressChart.data.datasets[1].data = elecData;
    progressChart.update();
  }

  // print single room
  function printRoom(id){
    const r = rooms.find(x=>x.id===id); if(!r) return alert("রুম পাওয়া যায়নি");
    const html = `<div style="font-family:Arial;padding:18px">
      <h2>রুম রিপোর্ট — ${escapeHtml(r.name)}</h2>
      <div>ভাড়া: ${r.rent} টাকা</div>
      <div>পূর্ব রিডিং: ${r.prev_read}</div>
      <div>বর্তমান রিডিং: ${r.curr_read}</div>
      <div>ইউনিট: ${r.units}</div>
      <div>বিদ্যুৎ বিল: ${r.elecBill} টাকা</div>
      <div style="font-weight:700;margin-top:8px">মোট বিল: ${r.totalBill} টাকা</div>
      <div style="margin-top:6px">স্ট্যাটাস: ${r.status === 'paid' ? 'Paid — '+(r.paidDate||'') : 'Due'}</div>
    </div>`;
    const w = window.open("","_blank","width=600,height=700");
    w.document.write(html); w.document.close(); w.focus(); w.print();
  }

  // initial render
  renderRooms();

  // expose API for tenant.js to use (room list)
  window.__ROOMS_API = {
    getRooms: ()=> JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms,
    refresh: ()=> { rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || []; renderRooms(); }
  };

  // refresh chart button
  document.getElementById("refreshChartBtn").addEventListener("click", () => updateChart());
});
