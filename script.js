let applications = JSON.parse(localStorage.getItem("applications")) || [];
let editIndex = null;
let chart = null;

document.addEventListener("DOMContentLoaded", () => {
  renderApplications();

  document.getElementById("applicationForm").addEventListener("submit", handleForm);
  document.getElementById("search").addEventListener("input", renderApplications);
  document.getElementById("sort").addEventListener("change", renderApplications);
  document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
  document.getElementById("clearAllBtn").addEventListener("click", clearAll);
});

function handleForm(e) {
  e.preventDefault();
  const company = document.getElementById("company").value.trim();
  const position = document.getElementById("position").value.trim();
  const date = document.getElementById("date").value;
  const status = document.getElementById("status").value;

  if (!company || !position || !date) return;

  if (editIndex !== null) {
    applications[editIndex] = { company, position, date, status };
    editIndex = null;
    document.getElementById("submitBtn").textContent = "Add Application";
  } else {
    applications.push({ company, position, date, status });
  }

  saveApplications();
  renderApplications();
  e.target.reset();
}

function renderApplications() {
  const tbody = document.getElementById("applicationList");
  tbody.innerHTML = "";

  const search = document.getElementById("search").value.toLowerCase();
  const sortBy = document.getElementById("sort").value;

  let filtered = applications.filter(app =>
    app.company.toLowerCase().includes(search) ||
    app.position.toLowerCase().includes(search)
  );

  if (sortBy === "company")
    filtered.sort((a, b) => a.company.localeCompare(b.company));
  else
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:18px;color:#6b7280;">No applications found — add one above.</td></tr>`;
  } else {
    filtered.forEach((app, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(app.company)}</td>
        <td>${escapeHtml(app.position)}</td>
        <td>${new Date(app.date).toLocaleDateString()}</td>
        <td>
          <select onchange="updateStatus(${index}, this.value)">
            <option ${app.status==="Applied"?"selected":""}>Applied</option>
            <option ${app.status==="Interview"?"selected":""}>Interview</option>
            <option ${app.status==="Selected"?"selected":""}>Selected</option>
            <option ${app.status==="Rejected"?"selected":""}>Rejected</option>
          </select>
        </td>
        <td>
          <button class="action-btn edit-btn" onclick="editApplication(${index})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteApplication(${index})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateSummary();
}

function updateStatus(index, newStatus) {
  applications[index].status = newStatus;
  saveApplications();
  renderApplications();
}

function updateSummary() {
  const counts = { Applied: 0, Interview: 0, Selected: 0, Rejected: 0 };
  applications.forEach(a => counts[a.status]++);

  document.getElementById("totalCount").textContent = applications.length;
  document.getElementById("appliedCount").textContent = counts.Applied;
  document.getElementById("interviewCount").textContent = counts.Interview;
  document.getElementById("selectedCount").textContent = counts.Selected;
  document.getElementById("rejectedCount").textContent = counts.Rejected;

  document.getElementById("badgeApplied").textContent = counts.Applied;
  document.getElementById("badgeInterview").textContent = counts.Interview;
  document.getElementById("badgeSelected").textContent = counts.Selected;
  document.getElementById("badgeRejected").textContent = counts.Rejected;

  updateChart(counts);
}

function updateChart(counts) {
  const ctx = document.getElementById("statusChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Applied", "Interview", "Selected", "Rejected"],
      datasets: [{
        data: [counts.Applied, counts.Interview, counts.Selected, counts.Rejected],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function editApplication(index) {
  const app = applications[index];
  document.getElementById("company").value = app.company;
  document.getElementById("position").value = app.position;
  document.getElementById("date").value = app.date;
  document.getElementById("status").value = app.status;
  editIndex = index;
  document.getElementById("submitBtn").textContent = "Save Changes";
}

function deleteApplication(index) {
  if (!confirm("Delete this application?")) return;
  applications.splice(index, 1);
  saveApplications();
  renderApplications();
}

function clearAll() {
  if (!confirm("Clear all applications?")) return;
  applications = [];
  saveApplications();
  renderApplications();
}

function exportCSV() {
  if (applications.length === 0) return alert("No applications to export.");
  const header = ["Company", "Position", "Date", "Status"];
  const rows = applications.map(a => [a.company, a.position, a.date, a.status]);
  const csv = header.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "job_applications.csv";
  a.click();
}

function saveApplications() {
  localStorage.setItem("applications", JSON.stringify(applications));
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m]));
}
