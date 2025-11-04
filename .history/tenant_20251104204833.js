document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tenantForm");
  const list = document.getElementById("tenantList");
  const clearBtn = document.getElementById("clearTenant");

  let tenants = JSON.parse(localStorage.getItem("tenants")) || [];

  const renderTenants = () => {
    list.innerHTML = tenants.map(t => `
      <div class="tenant">
        <img src="${t.photo}" width="100">
        <p><strong>${t.name}</strong> (${t.age} বছর)</p>
        <p>পেশা: ${t.profession}</p>
        <p>মোবাইল: ${t.mobile}</p>
        <p>ঠিকানা: ${t.present}</p>
        <p>NID: ${t.nid}</p>
      </div>
    `).join("");
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const reader = new FileReader();
    const file = document.getElementById("photo").files[0];
    reader.onload = () => {
      const tenant = {
        name: form.name.value,
        age: form.age.value,
        profession: form.profession.value,
        present: form.present.value,
        permanent: form.permanent.value,
        mobile: form.mobile.value,
        nid: form.nid.value,
        photo: reader.result
      };
      tenants.push(tenant);
      localStorage.setItem("tenants", JSON.stringify(tenants));
      renderTenants();
      form.reset();
    };
    if (file) reader.readAsDataURL(file);
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("সব তথ্য মুছে ফেলতে চান?")) {
      localStorage.removeItem("tenants");
      tenants = [];
      renderTenants();
    }
  });

  renderTenants();
});
