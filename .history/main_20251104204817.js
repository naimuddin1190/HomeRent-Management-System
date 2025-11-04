document.addEventListener("DOMContentLoaded", () => {
  const roomsContainer = document.getElementById("rooms");
  const addRoomBtn = document.getElementById("addRoom");
  const clearBtn = document.getElementById("clearData");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  let rooms = JSON.parse(localStorage.getItem("rooms")) || [];

  const renderRooms = () => {
    roomsContainer.innerHTML = "";
    rooms.forEach((room, index) => {
      const div = document.createElement("div");
      div.className = "room";
      div.innerHTML = `
        <h3>রুম ${index + 1}</h3>
        <label>ভাড়া (টাকা): <input type="number" value="${room.rent}" onchange="updateRoom(${index}, 'rent', this.value)"></label>
        <label>বিদ্যুৎ ইউনিট: <input type="number" value="${room.unit}" onchange="updateRoom(${index}, 'unit', this.value)"></label>
        <button onclick="removeRoom(${index})">❌ মুছুন</button>
        <p>মোট বিল: ${(Number(room.rent) + (Number(room.unit) * 10))} টাকা</p>
      `;
      roomsContainer.appendChild(div);
    });
    updateProgress();
  };

  addRoomBtn.addEventListener("click", () => {
    rooms.push({ rent: 0, unit: 0 });
    saveRooms();
    renderRooms();
  });

  window.updateRoom = (index, key, value) => {
    rooms[index][key] = value;
    saveRooms();
    renderRooms();
  };

  window.removeRoom = (index) => {
    rooms.splice(index, 1);
    saveRooms();
    renderRooms();
  };

  const saveRooms = () => {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  };

  const updateProgress = () => {
    const filled = rooms.filter(r => r.rent > 0 || r.unit > 0).length;
    const progress = rooms.length ? Math.round((filled / rooms.length) * 100) : 0;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% সম্পন্ন`;
  };

  clearBtn.addEventListener("click", () => {
    if (confirm("সব ডেটা মুছে ফেলতে চান?")) {
      localStorage.clear();
      rooms = [];
      renderRooms();
    }
  });

  renderRooms();
});
