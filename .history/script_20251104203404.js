let roomCount = 0;
const container = document.getElementById("roomContainer");
const addRoomBtn = document.getElementById("addRoomBtn");

function createRoomCard() {
  roomCount++;
  const card = document.createElement("div");
  card.className = "room";
  card.innerHTML = `
    <h3>Room ${roomCount}</h3>
    <input type="text" placeholder="Tenant Name" id="tenant${roomCount}">
    <input type="number" placeholder="Home Rent (Taka)" id="rent${roomCount}">
    <input type="number" placeholder="Previous Month Unit" id="prev${roomCount}">
    <input type="number" placeholder="Current Month Unit" id="curr${roomCount}">
    <button onclick="calculate(${roomCount})">Calculate</button>
    <button class="remove-btn" onclick="removeRoom(this)">Remove</button>
    <p id="result${roomCount}"></p>
  `;
  container.appendChild(card);
}

function removeRoom(btn) {
  btn.parentElement.remove();
}

function calculate(id) {
  const rent = parseFloat(document.getElementById(`rent${id}`).value) || 0;
  const prev = parseFloat(document.getElementById(`prev${id}`).value) || 0;
  const curr = parseFloat(document.getElementById(`curr${id}`).value) || 0;
  const units = curr - prev;
  const electricBill = units * 10;
  const total = rent + electricBill;

  document.getElementById(`result${id}`).innerHTML = `
    <strong>Units Used:</strong> ${units} <br>
    <strong>Electric Bill:</strong> ${electricBill} Taka <br>
    <strong>Total Bill:</strong> ${total} Taka
  `;

  updateChart(id, electricBill);
}

// Chart.js for Monthly Progress
const ctx = document.getElementById('progressChart').getContext('2d');
const progressChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Electric Bill (Taka)',
      data: [],
      backgroundColor: '#4f46e5'
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }
});

function updateChart(room, bill) {
  progressChart.data.labels.push(`Room ${room}`);
  progressChart.data.datasets[0].data.push(bill);
  progressChart.update();
}

addRoomBtn.addEventListener("click", createRoomCard);
