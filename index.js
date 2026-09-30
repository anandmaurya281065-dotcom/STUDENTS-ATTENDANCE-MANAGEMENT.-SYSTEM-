/* DOM ELEMENTS */
const nameInput = document.getElementById("studentName");
const dateInput = document.getElementById("attendanceDate");
const tableBody = document.querySelector("#attendanceTable tbody");
const searchInput = document.getElementById("searchInput");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const toastContainer = document.getElementById("toastContainer");

/* APPLICATION STATE */
let students = [];
let registeredUsers = [];
let currentUser = null;

/* INITIAL DEMO DATA */
const defaultStudents = [
    { id: 1, name: "Alex Johnson", attendance: {} },
    { id: 2, name: "Emily Davis", attendance: {} },
    { id: 3, name: "Marcus Vance", attendance: {} },
    { id: 4, name: "Sophia Chen", attendance: {} },
    { id: 5, name: "Liam Wilson", attendance: {} }
];

/* APPLICATION INITIALIZATION */
window.addEventListener("load", function () {
    loadRegisteredUsers();
    loadStudents();
    setTodayDate();
});

/* SCREEN NAVIGATION */
function showScreen(screenId) {
    ["loginScreen", "registerScreen", "dashboardScreen"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    const selectedScreen = document.getElementById(screenId);
    if (selectedScreen) {
        selectedScreen.classList.remove("hidden");
    }
}

/* DATA MANAGEMENT (localStorage) */
function loadStudents() {
    const savedStudents = localStorage.getItem("students");
    if (savedStudents) {
        try {
            students = JSON.parse(savedStudents);
        } catch (e) {
            students = [...defaultStudents];
        }
    } else {
        students = [...defaultStudents];
        saveData();
    }
}

function loadRegisteredUsers() {
    const savedUsers = localStorage.getItem("registeredUsers");
    if (savedUsers) {
        try {
            registeredUsers = JSON.parse(savedUsers);
        } catch (e) {
            registeredUsers = [];
        }
    }
}

function saveData() {
    localStorage.setItem("students", JSON.stringify(students));
}

function saveUsers() {
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
}

function setTodayDate() {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    const selectedDate = dateInput.value;
    let dirty = false;
    students.forEach((st, idx) => {
        if (!st.attendance[selectedDate]) {
            st.attendance[selectedDate] = (idx % 2 === 0)? "Present" : "Absent";
            dirty = true;
        }
    });
    if (dirty) saveData();

    dateInput.addEventListener("change", displayStudents);
}

/* AUTHENTICATION & LOGIN */
loginForm.addEventListener("submit", handleLogin);

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.querySelector('input[name="loginRole"]:checked').value;

    if (!username) {
        showToast("Please enter a username or email", "error");
        return;
    }

    if (registeredUsers.length > 0) {
        const existingUser = registeredUsers.find(
            user => (user.email.toLowerCase() === username.toLowerCase() || user.fullName.toLowerCase() === username.toLowerCase()) && user.password === password
        );

        if (!existingUser) {
            showToast("Invalid credentials or user does not exist!", "error");
            return;
        }
        currentUser = existingUser;
    } else {
        currentUser = {
            fullName: username.includes("@")? username.split("@")[0] : username,
            role: role
        };
    }

    updateUserInterface(currentUser.fullName, currentUser.role);
    showScreen("dashboardScreen");
    displayStudents();
    showToast(`Welcome back, ${currentUser.fullName}!`, "success");
}

function updateUserInterface(fullName, role) {
    document.getElementById("displayUser").innerText = fullName;
    document.getElementById("displayRole").innerText = role;
    document.getElementById("userInitial").innerText = fullName.charAt(0).toUpperCase();
}

/* REGISTRATION */
registerForm.addEventListener("submit", handleRegister);

function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const role = document.getElementById("regRole").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password!== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
    }

    const userExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
        showToast("An account with this email already exists!", "error");
        return;
    }

    const newUser = { fullName, email, role, password };
    registeredUsers.push(newUser);
    saveUsers();
    currentUser = newUser;

    registerForm.reset();
    updateUserInterface(fullName, role);
    showScreen("dashboardScreen");
    displayStudents();
    showToast("Registration successful! Welcome aboard.", "success");
}

/* LOGOUT & NAVIGATION */
document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = null;
    loginForm.reset();
    showScreen("loginScreen");
    showToast("Logged out successfully", "info");
});

document.getElementById("showRegisterBtn").addEventListener("click", () => showScreen("registerScreen"));
document.getElementById("showLoginBtn").addEventListener("click", () => showScreen("loginScreen"));

document.getElementById("forgotPassword").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Password reset link sent (simulated).", "info");
});

/* ADD STUDENT */
document.getElementById("addStudentBtn").addEventListener("click", addStudent);
nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        addStudent();
    }
});

function addStudent() {
    const name = nameInput.value.trim();
    if (!name) {
        showToast("Student name is required!", "error");
        return;
    }

    const newStudent = {
        id: Date.now(),
        name: name,
        attendance: {}
    };

    const currentDate = dateInput.value;
    newStudent.attendance[currentDate] = "Present";

    students.push(newStudent);
    nameInput.value = "";
    saveData();
    displayStudents();
    showToast(`Added "${name}" successfully!`, "success");
}

/* DISPLAY AND RENDER STUDENTS */
searchInput.addEventListener("input", displayStudents);

function displayStudents() {
    tableBody.innerHTML = "";
    const selectedDate = dateInput.value;
    const filterQuery = searchInput.value.toLowerCase().trim();

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(filterQuery)
    );

    let presentCount = 0;
    let absentCount = 0;

    students.forEach(student => {
        const status = student.attendance[selectedDate];
        if (status === "Present") presentCount++;
        else if (status === "Absent") absentCount++;
    });

    updateStatistics(students.length, presentCount, absentCount);

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="py-12 text-center text-slate-400">
                    <i class="fa-solid fa-folder-open text-4xl mb-3 block text-slate-300"></i>
                    <p class="text-base font-medium">No students found</p>
                    <p class="text-xs text-slate-400 mt-1">Try adding a new student or clearing your search filter.</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredStudents.forEach((student, index) => {
        const currentStatus = student.attendance[selectedDate] || "Unmarked";
        const serialNo = index + 1;
        const row = document.createElement("tr");
        row.className = "hover:bg-slate-50/80 transition-colors";

        row.innerHTML = `
            <td class="py-3.5 px-6 font-semibold text-slate-600">
                #${String(serialNo).padStart(3, '0')}
            </td>
            <td class="py-3.5 px-6">
                <div class="flex items-center space-x-2">
                    <span id="name-display-${student.id}" class="font-medium text-slate-800">${escapeHtml(student.name)}</span>
                    <button onclick="editStudentName(${student.id})" class="text-slate-400 hover:text-indigo-600 text-xs">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            </td>
            <td class="py-3.5 px-6 text-center">
                <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 space-x-1">
                    <button onclick="setAttendance(${student.id}, 'Present')"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentStatus === 'Present'? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                        <i class="fa-solid fa-check mr-1"></i>Present
                    </button>
                    <button onclick="setAttendance(${student.id}, 'Absent')"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentStatus === 'Absent'? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                        <i class="fa-solid fa-xmark mr-1"></i>Absent
                    </button>
                </div>
            </td>
            <td class="py-3.5 px-6 text-right">
                <button onclick="deleteStudent(${student.id})" class="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50" title="Delete Student">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/* UPDATE STATS BAR */
function updateStatistics(total, present, absent) {
    document.getElementById("statTotal").innerText = total;
    document.getElementById("statPresent").innerText = present;
    document.getElementById("statAbsent").innerText = absent;

    const rate = total > 0? Math.round((present / total) * 100) : 0;
    document.getElementById("statRate").innerText = `${rate}%`;
    document.getElementById("statProgressBar").style.width = `${rate}%`;
}

/* ATTENDANCE ACTIONS */
window.setAttendance = function(id, status) {
    const selectedDate = dateInput.value;
    const student = students.find(s => s.id === id);
    if (student) {
        student.attendance[selectedDate] = status;
        saveData();
        displayStudents();
    }
};

window.deleteStudent = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    students = students.filter(s => s.id!== id);
    saveData();
    displayStudents();
    showToast(`Removed student "${student.name}"`, "info");
};

window.editStudentName = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const newName = prompt("Edit student name:", student.name);
    if (newName && newName.trim()!== "") {
        student.name = newName.trim();
        saveData();
        displayStudents();
        showToast("Student name updated", "success");
    }
};

/* BATCH ACTIONS */
document.getElementById("markAllPresentBtn").addEventListener("click", () => {
    const selectedDate = dateInput.value;
    students.forEach(s => s.attendance[selectedDate] = "Present");
    saveData();
    displayStudents();
    showToast("Marked all students as Present", "success");
});

document.getElementById("markAllAbsentBtn").addEventListener("click", () => {
    const selectedDate = dateInput.value;
    students.forEach(s => s.attendance[selectedDate] = "Absent");
    saveData();
    displayStudents();
    showToast("Marked all students as Absent", "info");
});

document.getElementById("clearAttendanceBtn").addEventListener("click", () => {
    const selectedDate = dateInput.value;
    students.forEach(s => delete s.attendance[selectedDate]);
    saveData();
    displayStudents();
    showToast(`Cleared attendance for ${selectedDate}`, "info");
});

/* EXPORT CSV */
document.getElementById("exportCsvBtn").addEventListener("click", () => {
    const selectedDate = dateInput.value;
    if (students.length === 0) {
        showToast("No student records to export", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,S.No.,Student Name,Date,Status\n";
    students.forEach((s, idx) => {
        const status = s.attendance[selectedDate] || "Unmarked";
        csvContent += `"${idx + 1}","${s.name}","${selectedDate}","${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded attendance CSV", "success");
});

/* UTILITIES & TOASTS */
function showToast(message, type = "info") {
    const toast = document.createElement("div");

    const bgColors = {
        success: "bg-emerald-600 text-white",
        error: "bg-rose-600 text-white",
        info: "bg-slate-800 text-white"
    };

    const icons = {
        success: "fa-circle-check",
        error: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    toast.className = `animate-toast pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
        <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
