/* tenant.js
   Tenants: add/edit, family members, entry date auto, leave date (move to left list),
   store in localStorage under TENANTS_KEY and LEFT_TENANTS_KEY
*/

const TENANTS_KEY = "tenantsData";
const LEFT_KEY = "leftTenantsData";
const ROOMS_KEY = "roomsData";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tenantForm");
  const tenantListActive = document.getElementById("activeList");
  const tenantListLeft = document.getElementById("leftList");
  const tenantRoomSelect = document.getElementById("tenantRoom");
  const familyCountInp = document.getElementById("familyCount");
  const familyArea = document.getElementById("familyArea");
  const photoInput = document.getElementById("t_photo");
  const photoPreview = document.getElementById("photoPreview");
  const entryDateInp = document.getElementById("entryDate");
  const clearTenantsBtn = document.getElementById("clearTenants");
  const printTenantsBtn = document.getElementById("printTenants");
  const activeTab = document.getElementById("activeTab");
  const leftTab = document.getElementById("leftTab");

  let tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || [];
  let leftTenants = JSON.parse(localStorage.getItem(LEFT_KEY)) || [];
  let rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];

  // set entry date to today by default
  entryDateInp.value = new Date().toLocaleDateString('bn-BD');

  // populate rooms dropdown
  function populateRoomSelect(){
    rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms;
    tenantRoomSelect.innerHTML = "";
    if(rooms.length === 0){
      const opt = document.createElement("option"); opt.value=""; opt.textContent = "প্রথমে হোম পেজ থেকে রুম যোগ করুন"; tenantRoomSelect.appendChild(opt);
    } else {
      const hint = document.createElement("option"); hint.value=""; hint.textContent = "-- রুম নির্বাচন করুন --"; tenantRoomSelect.appendChild(hint);
      rooms.forEach(r => {
        const opt = document.createElement("option"); opt.value = r.id; opt.textContent = r.name || r.id;
        tenantRoomSelect.appendChild(opt);
      });
    }
  }
  populateRoomSelect();

  // listen for room changes from main page (storage event)
  window.addEventListener("storage", (e) => {
    if(e.key === "roomsUpdatedAt"){
      populateRoomSelect();
      rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms;
      renderAll();
    }
  });

  // dynamic family inputs
  familyCountInp.addEventListener("input", () => {
    const n = Number(familyCountInp.value || 0);
    familyArea.innerHTML = "";
    for(let i=1;i<=n;i++){
      const div = document.createElement("div"); div.className = "family-member";
      div.innerHTML = `
        <input placeholder="সদস্য ${i} নাম (উদাহরণ: স্ত্রী)" data-family-name>
        <input placeholder="বয়স" data-family-age>
        <input placeholder="সম্পর্ক (উদাহরণ: স্ত্রী/সন্তান)" data-family-rel>
      `;
      familyArea.appendChild(div);
    }
  });

  // image preview
  photoInput.addEventListener("change", () => {
    const f = photoInput.files[0];
    if(!f){ photoPreview.innerHTML = ""; return; }
    const reader = new FileReader();
    reader.onload = () => { photoPreview.innerHTML = `<img src="${reader.result}" alt="preview">`; }
    reader.readAsDataURL(f);
  });

  // render tenants (active & left)
  function renderAll(){
    tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || tenants;
    leftTenants = JSON.parse(localStorage.getItem(LEFT_KEY)) || leftTenants;
    renderActive();
    renderLeft();
  }

  function renderActive(){
    tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || tenants;
    if(tenants.length === 0){ tenantListActive.innerHTML = "<div style='color:#666'>কোনো ভাড়াটিয়া নেই।</div>"; return; }
    tenantListActive.innerHTML = tenants.map((t,idx) => {
      const roomName = (rooms.find(r=>r.id===t.roomId)||{}).name || t.roomId || "N/A";
      return `
        <div class="tenant-card" data-i="${idx}">
          <img src="${t.photo||''}" onerror="this.style.display='none'">
          <div class="tenant-meta">
            <div style="font-weight:800">${escapeHtml(t.name)} — <small style="color:#6b7280">${escapeHtml(roomName)}</small></div>
            <div>মোবাইল: ${escapeHtml(t.mobile)} • NID: ${escapeHtml(t.nid)}</div>
            <div>এন্ট্রি: ${escapeHtml(t.entryDate)}</div>
            <div style="margin-top:6px">
              <button class="btn outline btn-view" data-i="${idx}"><i class="fa-solid fa-circle-info"></i> বিস্তারিত</button>
              <button class="btn danger btn-leave" data-i="${idx}"><i class="fa-solid fa-door-open"></i> বাশা ছাড়লেন</button>
              <button class="btn primary btn-print" data-i="${idx}"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
            </div>
          </div>
        </div>`;
    }).join("");
    attachActiveButtons();
  }

  function renderLeft(){
    leftTenants = JSON.parse(localStorage.getItem(LEFT_KEY)) || leftTenants;
    if(leftTenants.length === 0){ tenantListLeft.innerHTML = "<div style='color:#666'>কেউ এখনও চলে যাননি।</div>"; return; }
    tenantListLeft.innerHTML = leftTenants.map((t,idx) => {
      const roomName = (rooms.find(r=>r.id===t.roomId)||{}).name || t.roomId || "N/A";
      return `
        <div class="tenant-card" data-i="${idx}">
          <img src="${t.photo||''}" onerror="this.style.display='none'">
          <div class="tenant-meta">
            <div style="font-weight:800">${escapeHtml(t.name)} — <small style="color:#6b7280">${escapeHtml(roomName)}</small></div>
            <div>এন্ট্রি: ${escapeHtml(t.entryDate)} • ছাড়ার তারিখ: ${escapeHtml(t.leaveDate)}</div>
            <div>পরিবার: ${t.family ? t.family.map(f => escapeHtml(f.name)).join(", ") : "নাই"}</div>
            <div style="margin-top:6px">
              <button class="btn outline btn-print-left" data-i="${idx}"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
            </div>
          </div>
        </div>`;
    }).join("");
    attachLeftButtons();
  }

  function attachActiveButtons(){
    tenantListActive.querySelectorAll(".btn-leave").forEach(b=>{
      b.addEventListener("click",(e)=>{
        const i = Number(e.currentTarget.dataset.i);
        markLeave(i);
      });
    });
    tenantListActive.querySelectorAll(".btn-view").forEach(b=>{
      b.addEventListener("click",(e)=>{
        const i = Number(e.currentTarget.dataset.i);
        viewDetails(i);
      });
    });
    tenantListActive.querySelectorAll(".btn-print").forEach(b=>{
      b.addEventListener("click",(e)=>{
        const i = Number(e.currentTarget.dataset.i);
        printTenant(i, false);
      });
    });
  }

  function attachLeftButtons(){
    tenantListLeft.querySelectorAll(".btn-print-left").forEach(b=>{
      b.addEventListener("click",(e)=>{
        const i = Number(e.currentTarget.dataset.i);
        printLeft(i);
      });
    });
  }

  // mark leave: ask for leave date, move to leftTenants
  function markLeave(index){
    const t = tenants[index];
    if(!t) return;
    const leaveDate = prompt("বাড়ি ছাড়ার তারিখ (বাংলা):", new Date().toLocaleDateString('bn-BD'));
    if(!leaveDate) return;
    const leftObj = Object.assign({}, t, { leaveDate });
    leftTenants.push(leftObj);
    tenants.splice(index,1);
    localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
    localStorage.setItem(LEFT_KEY, JSON.stringify(leftTenants));
    alert("ভাড়াটিয়া চলে যাওয়া হিসেবে ট্যাক করা হয়েছে।");
    renderAll();
  }

  // view details (expand modal-like simple)
  function viewDetails(i){
    const t = tenants[i];
    if(!t) return;
    let familyHtml = "";
    if(t.family && t.family.length){
      familyHtml = "<ul>"+ t.family.map(f=> `<li>${escapeHtml(f.name)} — ${escapeHtml(f.age)} — ${escapeHtml(f.rel)}</li>`).join("") + "</ul>";
    } else familyHtml = "<div>কোনো পরিবার সদস্য নেই</div>";

    const html = `<div style="font-family:Arial;padding:12px">
      <h3>${escapeHtml(t.name)}</h3>
      <div>রুম: ${(rooms.find(r=>r.id===t.roomId)||{}).name || t.roomId}</div>
      <div>মোবাইল: ${escapeHtml(t.mobile)}</div>
      <div>NID: ${escapeHtml(t.nid)}</div>
      <div>এন্ট্রি: ${escapeHtml(t.entryDate)}</div>
      <div style="margin-top:8px"><strong>পরিবার:</strong> ${familyHtml}</div>
    </div>`;
    const w = window.open("","_blank","width=500,height=600");
    w.document.write(html); w.document.close();
  }

  // print active tenant
  function printTenant(i, left=false){
    const arr = left ? leftTenants : tenants;
    const t = arr[i]; if(!t) return;
    const html = `<div style="font-family:Arial;padding:18px">
      <h2>ভাড়াটিয়ার প্রোফাইল — ${escapeHtml(t.name)}</h2>
      <div>রুম: ${(rooms.find(r=>r.id===t.roomId)||{}).name || t.roomId}</div>
      <div>মোবাইল: ${escapeHtml(t.mobile)}</div>
      <div>NID: ${escapeHtml(t.nid)}</div>
      <div>এন্ট্রি: ${escapeHtml(t.entryDate)}</div>
      ${ left ? `<div>ছাড়ার তারিখ: ${escapeHtml(t.leaveDate)}</div>` : "" }
      <div style="margin-top:12px">${t.photo ? `<img src="${t.photo}" style="max-width:220px;border-radius:8px">` : "" }</div>
    </div>`;
    const w = window.open("","_blank","width=600,height=700"); w.document.write(html); w.document.close(); w.focus(); w.print();
  }

  function printLeft(i){ printTenant(i, true); }

  // submit form add tenant
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const roomId = tenantRoomSelect.value;
    if(!roomId) return alert("অনুগ্রহ করে রুম নির্বাচন করুন।");
    const name = document.getElementById("t_name").value.trim();
    const age = document.getElementById("t_age").value.trim();
    const profession = document.getElementById("t_profession").value.trim();
    const mobile = document.getElementById("t_mobile").value.trim();
    const nid = document.getElementById("t_nid").value.trim();
    const present = document.getElementById("t_present").value.trim();
    const permanent = document.getElementById("t_permanent").value.trim();
    const entryDate = entryDateInp.value || new Date().toLocaleDateString('bn-BD');

    // family collect
    const family = [];
    familyArea.querySelectorAll(".family-member").forEach(div=>{
      const nameF = div.querySelector("[data-family-name]").value.trim();
      const ageF = div.querySelector("[data-family-age]").value.trim();
      const relF = div.querySelector("[data-family-rel]").value.trim();
      if(nameF) family.push({ name: nameF, age: ageF, rel: relF });
    });

    // photo to dataURL
    const file = photoInput.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = () => {
        const photo = reader.result;
        saveTenantObj({ roomId, name, age, profession, mobile, nid, present, permanent, entryDate, family, photo });
      };
      reader.readAsDataURL(file);
    } else {
      saveTenantObj({ roomId, name, age, profession, mobile, nid, present, permanent, entryDate, family, photo: "" });
    }
  });

  function saveTenantObj(obj){
    tenants.push(obj);
    localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
    // optionally link tenantId to room object
    // update rooms to record tenantId
    rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms;
    const room = rooms.find(r=>r.id === obj.roomId);
    if(room){ room.tenantId = obj.mobile || obj.name; localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)); localStorage.setItem("roomsUpdatedAt", Date.now()); }
    // reset form
    form.reset(); familyArea.innerHTML=""; photoPreview.innerHTML=""; entryDateInp.value = new Date().toLocaleDateString('bn-BD'); populateRoomSelect(); renderAll();
    alert("ভাড়াটিয়ার তথ্য সেভ হয়েছে।");
  }

  // clear tenants
  clearTenantsBtn.addEventListener("click", () => {
    if(!confirm("সকল ভাড়াটিয়ার তথ্য মুছে ফেলতে চান?")) return;
    localStorage.removeItem(TENANTS_KEY);
    localStorage.removeItem(LEFT_KEY);
    tenants = []; leftTenants = [];
    renderAll();
  });

  // print tenants list
  printTenantsBtn.addEventListener("click", () => {
    tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || tenants;
    let rows = "";
    tenants.forEach((t,i)=>{
      const roomName = (rooms.find(r=>r.id===t.roomId)||{}).name || t.roomId;
      rows += `<tr><td style="padding:6px;border:1px solid #ddd">${i+1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(roomName)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.name)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.mobile)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.nid)}</td></tr>`;
    });
    const html = `<div style="font-family:Arial;padding:18px">
      <h2>ভাড়াটিয়াদের তালিকা</h2>
      <table style="width:100%;border-collapse:collapse">${rows ? `<thead><tr>
        <th style="padding:6px;border:1px solid #ddd">#</th>
        <th style="padding:6px;border:1px solid #ddd">রুম</th>
        <th style="padding:6px;border:1px solid #ddd">নাম</th>
        <th style="padding:6px;border:1px solid #ddd">মোবাইল</th>
        <th style="padding:6px;border:1px solid #ddd">NID</th>
      </tr></thead><tbody>${rows}</tbody>` : '<div style="color:#666">কোনো ভাড়াটিয়া নেই</div>'}</table></div>`;
    const w = window.open("","_blank","width=900,height=700"); w.document.write(html); w.document.close(); w.focus(); w.print();
  });

  // tabs
  activeTab.addEventListener("click", ()=>{ activeTab.classList.add("active"); leftTab.classList.remove("active"); document.getElementById("activeList").style.display="block"; document.getElementById("leftList").style.display="none"; });
  leftTab.addEventListener("click", ()=>{ leftTab.classList.add("active"); activeTab.classList.remove("active"); document.getElementById("activeList").style.display="none"; document.getElementById("leftList").style.display="block"; });

  function escapeHtml(s){ if(s==null) return ""; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // initial render
  renderAll();
});
