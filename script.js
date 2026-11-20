// Casting Desk - plain JavaScript + localStorage (no backend needed)

// ---------- data ----------
var roles = JSON.parse(localStorage.getItem("roles")) || [];
var people = JSON.parse(localStorage.getItem("people")) || [];
var criteria = JSON.parse(localStorage.getItem("criteria")) || ["Acting", "Voice", "Expression"];

var editRoleId = null;    // set when a role is being edited
var editPersonId = null;  // set when a candidate is being edited

function save() {
  localStorage.setItem("roles", JSON.stringify(roles));
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("criteria", JSON.stringify(criteria));
}

function $(id) { return document.getElementById(id); }

function roleName(id) {
  for (var i = 0; i < roles.length; i++) {
    if (roles[i].id == id) return roles[i].name;
  }
  return "-";
}

// total of all current criteria for one candidate
function total(p) {
  if (!p.scores) return null;
  var sum = 0;
  for (var i = 0; i < criteria.length; i++) {
    sum = sum + (p.scores[criteria[i]] || 0);
  }
  return sum;
}

// ---------- page switching ----------
var buttons = document.querySelectorAll("nav button");
for (var i = 0; i < buttons.length; i++) {
  buttons[i].onclick = function () {
    var sections = document.querySelectorAll("section");
    for (var j = 0; j < sections.length; j++) sections[j].classList.add("hide");
    for (var k = 0; k < buttons.length; k++) buttons[k].classList.remove("active");
    $(this.dataset.page).classList.remove("hide");
    this.classList.add("active");
    render();
  };
}

// ---------- roles ----------
$("addRole").onclick = function () {
  var name = $("roleName").value.trim();
  if (name == "") { alert("Please enter a role name."); return; }

  if (editRoleId == null) {
    roles.push({ id: Date.now(), name: name, desc: $("roleDesc").value.trim() });
  } else {
    for (var i = 0; i < roles.length; i++) {
      if (roles[i].id == editRoleId) {
        roles[i].name = name;
        roles[i].desc = $("roleDesc").value.trim();
      }
    }
  }
  resetRoleForm();
  save(); render();
};

function resetRoleForm() {
  editRoleId = null;
  $("roleName").value = "";
  $("roleDesc").value = "";
  $("addRole").innerText = "Add role";
  $("cancelRole").classList.add("hide");
}
$("cancelRole").onclick = resetRoleForm;

function editRole(id) {
  for (var i = 0; i < roles.length; i++) {
    if (roles[i].id == id) {
      $("roleName").value = roles[i].name;
      $("roleDesc").value = roles[i].desc;
    }
  }
  editRoleId = id;
  $("addRole").innerText = "Save changes";
  $("cancelRole").classList.remove("hide");
  window.scrollTo(0, 0);
}

function deleteRole(id) {
  for (var i = 0; i < people.length; i++) {
    if (people[i].roleId == id) { alert("Some candidates applied for this role, so it can't be deleted."); return; }
  }
  roles = roles.filter(function (r) { return r.id != id; });
  save(); render();
}

// ---------- candidates ----------
$("addPerson").onclick = function () {
  var name = $("pName").value.trim();
  if (roles.length == 0) { alert("Add a role first."); return; }
  if (name == "") { alert("Please enter the candidate's name."); return; }

  if (editPersonId == null) {
    people.push({
      id: Date.now(), name: name, phone: $("pPhone").value.trim(),
      roleId: $("pRole").value, exp: $("pExp").value || 0,
      status: "Applied", slot: null, scores: null
    });
  } else {
    for (var i = 0; i < people.length; i++) {
      if (people[i].id == editPersonId) {
        people[i].name = name;
        people[i].phone = $("pPhone").value.trim();
        people[i].roleId = $("pRole").value;
        people[i].exp = $("pExp").value || 0;
      }
    }
  }
  resetPersonForm();
  save(); render();
};

function resetPersonForm() {
  editPersonId = null;
  $("pName").value = ""; $("pPhone").value = ""; $("pExp").value = "";
  $("addPerson").innerText = "Add candidate";
  $("cancelPerson").classList.add("hide");
}
$("cancelPerson").onclick = resetPersonForm;

function editPerson(id) {
  for (var i = 0; i < people.length; i++) {
    if (people[i].id == id) {
      $("pName").value = people[i].name;
      $("pPhone").value = people[i].phone;
      $("pRole").value = people[i].roleId;
      $("pExp").value = people[i].exp;
    }
  }
  editPersonId = id;
  $("addPerson").innerText = "Save changes";
  $("cancelPerson").classList.remove("hide");
  window.scrollTo(0, 0);
}

function deletePerson(id) {
  if (!confirm("Remove this candidate?")) return;
  people = people.filter(function (p) { return p.id != id; });
  save(); render();
}

$("search").oninput = render;
$("filterStatus").onchange = render;

// ---------- audition slots ----------
$("addSlot").onclick = function () {
  var id = $("sPerson").value, date = $("sDate").value, time = $("sTime").value;
  if (id == "" || date == "" || time == "") { alert("Pick a candidate, a date and a time."); return; }

  // conflict check: is somebody else already booked at this date + time?
  for (var i = 0; i < people.length; i++) {
    var s = people[i].slot;
    if (s && s.date == date && s.time == time && people[i].id != id) {
      alert("Clash! " + people[i].name + " already has this slot.");
      return;
    }
  }
  for (var j = 0; j < people.length; j++) {
    if (people[j].id == id) {
      people[j].slot = { date: date, time: time };
      // only move to Scheduled if they are still at the early stage
      if (people[j].status == "Applied") people[j].status = "Scheduled";
    }
  }
  save(); render();
};

function cancelSlot(id) {
  for (var i = 0; i < people.length; i++) {
    if (people[i].id == id) {
      people[i].slot = null;
      if (people[i].status == "Scheduled") people[i].status = "Applied";
    }
  }
  save(); render();
}

// ---------- criteria ----------
$("addCrit").onclick = function () {
  var name = $("critName").value.trim();
  if (name == "") { alert("Type a criterion name."); return; }
  if (criteria.indexOf(name) != -1) { alert("That criterion already exists."); return; }
  criteria.push(name);
  $("critName").value = "";
  save(); render();
};

function removeCrit(index) {
  if (criteria.length == 1) { alert("Keep at least one criterion."); return; }
  if (!confirm("Remove '" + criteria[index] + "'? It will no longer count in totals.")) return;
  criteria.splice(index, 1);
  save(); render();
}

// ---------- scoring ----------
$("saveScore").onclick = function () {
  var id = $("scPerson").value;
  if (id == "") { alert("Choose a candidate."); return; }

  var newScores = {};
  for (var i = 0; i < criteria.length; i++) {
    var box = $("crit" + i);
    var val = box.value;
    if (val == "" || Number(val) < 0 || Number(val) > 10) {
      alert("Enter a score from 0 to 10 for " + criteria[i] + ".");
      return;
    }
    newScores[criteria[i]] = Number(val);
  }

  for (var j = 0; j < people.length; j++) {
    if (people[j].id == id) {
      people[j].scores = newScores;
      if (people[j].status == "Applied" || people[j].status == "Scheduled") people[j].status = "Auditioned";
    }
  }
  save(); render();
};

// ---------- final decision ----------
function setStatus(id, status) {
  for (var i = 0; i < people.length; i++) {
    if (people[i].id == id) people[i].status = status;
  }
  save(); render();
}

// ---------- sample data / clear ----------
$("sampleBtn").onclick = function () {
  criteria = ["Acting", "Voice", "Expression"];
  roles = [
    { id: 1, name: "Lead - Meera", desc: "Strong emotional range, Hindi + English" },
    { id: 2, name: "Villain - Rudra", desc: "Deep voice, intense presence" },
    { id: 3, name: "Friend - Pinku", desc: "Comic timing" }
  ];
  people = [
    { id: 11, name: "Ananya Sharma", phone: "98765 43210", roleId: 1, exp: 3, status: "Auditioned", slot: { date: "2026-12-02", time: "10:00" }, scores: { Acting: 9, Voice: 8, Expression: 9 } },
    { id: 12, name: "Kabir Mehta", phone: "91234 56780", roleId: 2, exp: 5, status: "Auditioned", slot: { date: "2026-12-02", time: "11:00" }, scores: { Acting: 7, Voice: 9, Expression: 8 } },
    { id: 13, name: "Simran Kaur", phone: "99887 76655", roleId: 1, exp: 1, status: "Scheduled", slot: { date: "2026-12-03", time: "14:30" }, scores: null },
    { id: 14, name: "Dev Arora", phone: "90000 11122", roleId: 3, exp: 0, status: "Applied", slot: null, scores: null }
  ];
  save(); render();
};

$("clearBtn").onclick = function () {
  if (confirm("Delete all roles and candidates?")) {
    roles = []; people = []; criteria = ["Acting", "Voice", "Expression"];
    save(); render();
  }
};

// ---------- drawing everything on screen ----------
function roleOptions() {
  if (roles.length == 0) return "<option value=''>Add a role first</option>";
  var h = "";
  for (var i = 0; i < roles.length; i++) h += "<option value='" + roles[i].id + "'>" + roles[i].name + "</option>";
  return h;
}

function personOptions() {
  if (people.length == 0) return "<option value=''>No candidates yet</option>";
  var h = "";
  for (var i = 0; i < people.length; i++) h += "<option value='" + people[i].id + "'>" + people[i].name + "</option>";
  return h;
}

function render() {
  // overview numbers
  var count = function (st) { return people.filter(function (p) { return p.status == st; }).length; };
  $("stats").innerHTML =
    "<div class='stat'><b>" + roles.length + "</b><span>Roles open</span></div>" +
    "<div class='stat'><b>" + people.length + "</b><span>Candidates</span></div>" +
    "<div class='stat'><b>" + count("Scheduled") + "</b><span>Auditions booked</span></div>" +
    "<div class='stat'><b>" + count("Shortlisted") + "</b><span>Shortlisted</span></div>" +
    "<div class='stat'><b>" + count("Selected") + "</b><span>Selected</span></div>";

  // roles list
  var r = "";
  for (var i = 0; i < roles.length; i++) {
    r += "<div class='roleItem'><div>" + roles[i].name + "<small>" + roles[i].desc + "</small></div><div>" +
         "<button class='small' onclick='editRole(" + roles[i].id + ")'>Edit</button>" +
         "<button class='small' onclick='deleteRole(" + roles[i].id + ")'>Delete</button></div></div>";
  }
  $("roleList").innerHTML = r || "<p class='empty'>No roles yet. Add the first one above.</p>";

  // dropdowns (keep what was selected)
  var oldRole = $("pRole").value, oldSlotPerson = $("sPerson").value, oldScorePerson = $("scPerson").value;
  $("pRole").innerHTML = roleOptions();
  $("sPerson").innerHTML = personOptions();
  $("scPerson").innerHTML = personOptions();
  if (oldRole) $("pRole").value = oldRole;
  if (oldSlotPerson) $("sPerson").value = oldSlotPerson;
  if (oldScorePerson) $("scPerson").value = oldScorePerson;

  // candidates table with search + filter
  var text = $("search").value.toLowerCase(), st = $("filterStatus").value;
  var t = "<tr><th>Name</th><th>Contact</th><th>Role</th><th>Experience</th><th>Status</th><th></th></tr>";
  var shown = 0;
  for (var a = 0; a < people.length; a++) {
    var p = people[a];
    if (p.name.toLowerCase().indexOf(text) == -1) continue;
    if (st != "" && p.status != st) continue;
    shown++;
    t += "<tr><td>" + p.name + "</td><td>" + p.phone + "</td><td>" + roleName(p.roleId) + "</td><td>" + p.exp + " yrs</td>" +
         "<td><span class='tag " + p.status + "'>" + p.status + "</span></td>" +
         "<td><button class='small' onclick='editPerson(" + p.id + ")'>Edit</button>" +
         "<button class='small' onclick='deletePerson(" + p.id + ")'>Remove</button></td></tr>";
  }
  $("peopleTable").innerHTML = shown ? t : "<tr><td class='empty'>No candidates found.</td></tr>";

  // slots table (sorted by date, then time)
  var booked = people.filter(function (p) { return p.slot; });
  booked.sort(function (x, y) { return (x.slot.date + x.slot.time).localeCompare(y.slot.date + y.slot.time); });
  var s = "<tr><th>Date</th><th>Time</th><th>Candidate</th><th>Role</th><th></th></tr>";
  for (var b = 0; b < booked.length; b++) {
    s += "<tr><td>" + booked[b].slot.date + "</td><td>" + booked[b].slot.time + "</td><td>" + booked[b].name +
         "</td><td>" + roleName(booked[b].roleId) + "</td>" +
         "<td><button class='small' onclick='cancelSlot(" + booked[b].id + ")'>Cancel slot</button></td></tr>";
  }
  $("slotTable").innerHTML = booked.length ? s : "<tr><td class='empty'>No slots booked yet.</td></tr>";

  // criteria chips + score input boxes
  var chips = "", boxes = "";
  for (var c = 0; c < criteria.length; c++) {
    chips += "<span class='chip'>" + criteria[c] + "<button onclick='removeCrit(" + c + ")'>x</button></span>";
    boxes += "<div class='scoreBox'><label>" + criteria[c] + "</label><input id='crit" + c + "' type='number' min='0' max='10'></div>";
  }
  $("critList").innerHTML = chips;
  $("scoreInputs").innerHTML = boxes;

  // scores table
  var max = criteria.length * 10;
  var sc = "<tr><th>Candidate</th>";
  for (var h = 0; h < criteria.length; h++) sc += "<th>" + criteria[h] + "</th>";
  sc += "<th>Total / " + max + "</th></tr>";
  var scored = people.filter(function (p) { return p.scores; });
  for (var d = 0; d < scored.length; d++) {
    sc += "<tr><td>" + scored[d].name + "</td>";
    for (var e = 0; e < criteria.length; e++) sc += "<td>" + (scored[d].scores[criteria[e]] || 0) + "</td>";
    sc += "<td><b>" + total(scored[d]) + "</b></td></tr>";
  }
  $("scoreTable").innerHTML = scored.length ? sc : "<tr><td class='empty'>Nobody scored yet.</td></tr>";

  // shortlist: highest total first
  var ranked = scored.slice().sort(function (x, y) { return total(y) - total(x); });
  var f = "<tr><th>Rank</th><th>Candidate</th><th>Role</th><th>Total / " + max + "</th><th>Decision</th></tr>";
  var choices = ["Auditioned", "Shortlisted", "Selected", "Rejected"];
  for (var g = 0; g < ranked.length; g++) {
    var w = ranked[g], opts = "";
    for (var k = 0; k < choices.length; k++) {
      opts += "<option" + (w.status == choices[k] ? " selected" : "") + ">" + choices[k] + "</option>";
    }
    f += "<tr" + (g == 0 ? " class='top'" : "") + "><td>" + (g + 1) + "</td><td>" + w.name + "</td><td>" + roleName(w.roleId) +
         "</td><td>" + total(w) + "</td><td><select onchange='setStatus(" + w.id + ", this.value)'>" + opts + "</select></td></tr>";
  }
  $("finalTable").innerHTML = ranked.length ? f : "<tr><td class='empty'>Score some candidates first.</td></tr>";
}

render();
