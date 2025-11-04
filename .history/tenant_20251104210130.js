/* tenant.js
   Tenant form handling: save per-room tenant profile, photo upload (dataURL), print, delete, edit
*/

// LocalStorage key
const TENANTS_KEY = "tenantsData";
const ROOMS_KEY = "roomsData";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tenantForm");
  const tenantList = document.getElementById("tenantList");
  const tenantRoomSelect = document.getElementById("tenantRoom");
  const photoInput = document.getElementById("t_photo");
  const photoPreview = document.getElementById("photoPreview");
  const clearTenantsBtn = document.getElementById("clearTenants");
  const printTenantsBtn = document.getElementById("printTenants");

  // load tenants and rooms
  let tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || [];
  let rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];

  // fill room select
  function populateRoomSelect() {
    rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms;
    tenantRoomSelect.innerHTML = "";
    if(rooms.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "প্রথমে রুম যোগ করুন (হোম পেজে যান)";
      tenantRoomSelect.appendChild(opt);
    } else {
      tenantRoomSelect.innerHTML = '<option value="">-- রুম নির্বাচন করুন --</option>';
      rooms.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.name || r.id;
        tenantRoomSelect.appendChild(opt);
      });
    }
  }

  populateRoomSelect();

  // update when rooms change in other tab (listening to localStorage change)
  window.addEventListener("storage", (e) => {
    if(e.key === "roomsUpdatedAt") populateRoomSelect();
  });

  // preview photo
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(!file) { photoPreview.innerHTML = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      photoPreview.innerHTML = `<img src="${reader.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
  });

  // render tenant list
  function renderTenants() {
    tenants = JSON.parse(localStorage.getItem(TENANTS_KEY)) || tenants;
    if(tenants.length === 0) {
      tenantList.innerHTML = "<div style='color:#666'>কোনো ভাড়াটিয়া পাওয়া যায়নি।</div>";
      return;
    }
    tenantList.innerHTML = tenants.map((t, i) => {
      // find room name
      const roomName = (rooms.find(r=> r.id === t.roomId) || {}).name || t.roomId || "N/A";
      return `
        <div class="tenant-card" data-index="${i}">
          <img src="${t.photo || ''}" alt="photo" onerror="this.style.display='none'">
          <div class="tenant-meta">
            <div style="font-weight:800">${escapeHtml(t.name)} — <small style="color:#6b7280">${escapeHtml(roomName)}</small></div>
            <div>বয়স: ${escapeHtml(t.age)} • পেশা: ${escapeHtml(t.profession)}</div>
            <div>মোবাইল: ${escapeHtml(t.mobile)} • NID: ${escapeHtml(t.nid)}</div>
            <div>ঠিকানা: ${escapeHtml(t.present)}</div>
            <div style="margin-top:8px">
              <button class="btn outline btn-edit" data-i="${i}"><i class="fa-solid fa-pen"></i> সম্পাদনা</button>
              <button class="btn danger btn-delete" data-i="${i}"><i class="fa-solid fa-trash"></i> মুছুন</button>
              <button class="btn primary btn-print" data-i="${i}"><i class="fa-solid fa-print"></i> প্রিন্ট</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
    attachTenantButtons();
  }

  function attachTenantButtons(){
    tenantList.querySelectorAll(".btn-delete").forEach(b => {
      b.addEventListener("click", (e) => {
        const i = Number(e.target.closest("button").dataset.i);
        if(!confirm("এই ভাড়াটিয়ার তথ্য মুছে ফেলতে চান?")) return;
        tenants.splice(i,1);
        localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
        renderTenants();
      });
    });
    tenantList.querySelectorAll(".btn-edit").forEach(b => {
      b.addEventListener("click", (e) => {
        const i = Number(e.target.closest("button").dataset.i);
        const t = tenants[i];
        // populate form for editing (we will delete old and re-add on submit)
        document.getElementById("tenantRoom").value = t.roomId || "";
        document.getElementById("t_name").value = t.name || "";
        document.getElementById("t_age").value = t.age || "";
        document.getElementById("t_profession").value = t.profession || "";
        document.getElementById("t_mobile").value = t.mobile || "";
        document.getElementById("t_nid").value = t.nid || "";
        document.getElementById("t_present").value = t.present || "";
        document.getElementById("t_permanent").value = t.permanent || "";
        photoPreview.innerHTML = t.photo ? `<img src="${t.photo}" alt="preview">` : "";
        // remove old entry
        tenants.splice(i,1);
        localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
        renderTenants();
      });
    });
    tenantList.querySelectorAll(".btn-print").forEach(b => {
      b.addEventListener("click", (e) => {
        const i = Number(e.target.closest("button").dataset.i);
        printTenant(i);
      });
    });
  }

  // form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const roomId = tenantRoomSelect.value;
    if(!roomId) return alert("রুম নির্বাচন করুন।");
    const name = document.getElementById("t_name").value.trim();
    const age = document.getElementById("t_age").value.trim();
    const profession = document.getElementById("t_profession").value.trim();
    const mobile = document.getElementById("t_mobile").value.trim();
    const nid = document.getElementById("t_nid").value.trim();
    const present = document.getElementById("t_present").value.trim();
    const permanent = document.getElementById("t_permanent").value.trim();

    // handle photo as dataURL
    const file = photoInput.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = () => {
        const photoData = reader.result;
        const tenant = { roomId, name, age, profession, mobile, nid, present, permanent, photo: photoData };
        tenants.push(tenant);
        localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
        form.reset();
        photoPreview.innerHTML = "";
        renderTenants();
        alert("ভাড়াটিয়ার তথ্য সেভ হয়েছে।");
      };
      reader.readAsDataURL(file);
    } else {
      const tenant = { roomId, name, age, profession, mobile, nid, present, permanent, photo: "" };
      tenants.push(tenant);
      localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants));
      form.reset();
      photoPreview.innerHTML = "";
      renderTenants();
      alert("ভাড়াটিয়ার তথ্য সেভ হয়েছে।");
    }
  });

  // clear tenants
  clearTenantsBtn.addEventListener("click", () => {
    if(!confirm("সব ভাড়াটিয়ার তথ্য মুছে ফেলতে চান?")) return;
    localStorage.removeItem(TENANTS_KEY);
    tenants = [];
    renderTenants();
  });

  // print tenants list (simple layout)
  printTenantsBtn.addEventListener("click", () => {
    const html = buildTenantPrintHtml();
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  });

  function buildTenantPrintHtml() {
    const date = new Date().toLocaleString('bn-BD');
    let rows = "";
    tenants.forEach((t, idx) => {
      const roomName = (rooms.find(r => r.id === t.roomId) || {}).name || t.roomId || "N/A";
      rows += `<tr>
        <td style="padding:6px;border:1px solid #ddd">${idx+1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(roomName)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.name)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.mobile)}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(t.nid)}</td>
      </tr>`;
    });

    return `
      <div style="font-family:Arial;padding:18px">
        <h2>ভাড়াটিয়াদের তালিকা</h2>
        <div style="color:#666">তারিখ: ${date}</div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ddd">#</th>
              <th style="padding:6px;border:1px solid #ddd">রুম</th>
              <th style="padding:6px;border:1px solid #ddd">নাম</th>
              <th style="padding:6px;border:1px solid #ddd">মোবাইল</th>
              <th style="padding:6px;border:1px solid #ddd">NID</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // print single tenant
  function printTenant(i) {
    const t = tenants[i];
    if(!t) return alert("ভাড়াটিয়া পাওয়া যায়নি।");
    const roomName = (rooms.find(r => r.id === t.roomId) || {}).name || t.roomId || "N/A";
    const html = `
      <div style="font-family:Arial;padding:18px">
        <h2>ভাড়াটিয়ার প্রোফাইল — ${escapeHtml(t.name)}</h2>
        <div>রুম: ${escapeHtml(roomName)}</div>
        <div>বয়স: ${escapeHtml(t.age)}</div>
        <div>পেশা: ${escapeHtml(t.profession)}</div>
        <div>মোবাইল: ${escapeHtml(t.mobile)}</div>
        <div>NID: ${escapeHtml(t.nid)}</div>
        <div>বর্তমান ঠিকানা: ${escapeHtml(t.present)}</div>
        <div>স্থায়ী: ${escapeHtml(t.permanent)}</div>
        <div style="margin-top:12px">${t.photo ? `<img src="${t.photo}" style="max-width:220px;border-radius:8px">` : ""}</div>
      </div>
    `;
    const w = window.open("", "_blank", "width=600,height=700");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  // escape
  function escapeHtml(str){ if(str==null) return ""; return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

  // initial render
  renderTenants();

  // if rooms change in storage (via main page), refresh local rooms and update select
  window.addEventListener("storage", (e) => {
    if(e.key === "roomsUpdatedAt") {
      rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || rooms;
      populateRoomSelect();
      renderTenants();
    }
  });

});
