// #region DOM Element References:
const themeBtn = document.getElementById("theme-btn");

const totalTasks = document.getElementById("total-tasks");
const pendingTasks = document.getElementById("pending-tasks");
const inProgressTasks = document.getElementById("in-progress-tasks");
const completedTasks = document.getElementById("completed-tasks");

const notificationBox = document.getElementById("message-section");
const notificationText = document.getElementById("activity-msg");

const taskTitle = document.getElementById("task-title");
const taskDesc = document.getElementById("task-desc");
const taskDate = document.getElementById("task-date");
const taskPriority = document.getElementById("task-priority");
const taskStatus = document.getElementById("task-status");

const errorMsg = document.getElementById("error-msg");
const addBtn = document.getElementById("add-button");

const searchBox = document.getElementById("search");
const filterPriority = document.getElementById("filter-priority");
const filterStatus = document.getElementById("filter-status");
const resetButton = document.getElementById("reset-button");

const taskBox = document.getElementById("tasks-box");
// #endregion -----------------

// #region Theme Management:
function setCookie(name, value, duration) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + duration);

    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();

        if (trimmedCookie.startsWith(name + "=")) {
            return trimmedCookie.substring(name.length + 1);
        }
    }

    return null;
}

function applyTheme() {
    const savedTheme = getCookie("theme");

    if (savedTheme === "dark") {
        document.body.classList.remove("light-theme");
        themeBtn.innerHTML = `<i id="nav-icon" class="bi bi-brightness-high"></i> Light Mode`;
        return;
    }

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        themeBtn.innerHTML = `<i id="nav-icon" class="bi bi-brightness-high-fill"></i> Dark Mode`;
        return;
    }

    if (savedTheme === null) {
        setCookie("theme", "dark", 30);
        return;
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-theme");

    if (document.body.classList.contains("light-theme")) {
        themeBtn.innerHTML = `<i id="nav-icon" class="bi bi-brightness-high-fill"></i> Dark Mode`;
        setCookie("theme", "light", 30);
        return;
    }
    themeBtn.innerHTML = `<i id="nav-icon" class="bi bi-brightness-high"></i> Light Mode`;
    setCookie("theme", "dark", 30);
}

themeBtn.addEventListener("click", toggleTheme);
applyTheme();
// #endregion -----------------

// #region Local Storage:
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");

    if (savedTasks !== null) {
        const parsedTasks = JSON.parse(savedTasks);

        tasks.length = 0;

        parsedTasks.forEach((task) => {
            tasks.push(new Task(task.title, task.description, task.dueDate, task.priority, task.status || task._status));
        });
    }
}

window.addEventListener("storage", () => {
    tasks.length = 0;
    loadTasks();
    filterTasks();
});
// #endregion -----------------

// #region Task State & Model:
const tasks = [];
let editingTaskId = null;

class Task {
    constructor(title, description, dueDate, priority, status) {
        this.id = Date.now();
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
    }

    get status() {
        return this._status;
    }

    set status(value) {
        const validStatuses = ["pending", "in-progress", "completed"];

        if (validStatuses.includes(value)) {
            this._status = value;
        } else {
            console.error("Invalid task status.");
        }
    }
}
// #endregion -----------------

// #region Notifications:
let messageTimeout;
function showMessage(message) {
    clearTimeout(messageTimeout);

    notificationText.textContent = message;
    notificationBox.classList.remove("dsp-none");

    messageTimeout = setTimeout(() => {
        notificationText.textContent = "";
        notificationBox.classList.add("dsp-none");
    }, 3000);
}
// #endregion -----------------

// #region Task Validation:
function showValidationError(errorField, errorMessage) {
    errorField.classList.add("red-border");
    errorMsg.textContent = errorMessage;
}

function clearValidationError() {
    taskTitle.classList.remove("red-border");
    taskDesc.classList.remove("red-border");
    taskDate.classList.remove("red-border");
    errorMsg.textContent = "";
}

function validateTitle() {
    taskTitle.classList.remove("red-border");
    const titleRegex = /^.{3,40}$/;

    if (taskTitle.value.trim() === "") {
        showValidationError(taskTitle, "Please enter a task title.");
        return false;
    }

    if (!titleRegex.test(taskTitle.value.trim())) {
        showValidationError(taskTitle, "Task title must be between 3 and 40 characters.");
        return false;
    }

    errorMsg.textContent = "";
    return true;
}

function validateDesc() {
    taskDesc.classList.remove("red-border");

    if (taskDesc.value.trim().length > 200) {
        showValidationError(taskDesc, "Task description cannot exceed 200 characters.");
        return false;
    }

    errorMsg.textContent = "";
    return true;
}

function validateDate() {
    taskDate.classList.remove("red-border");
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (taskDate.value === "") {
        showValidationError(taskDate, "Please select a due date.");
        return false;
    }

    if (new Date(taskDate.value) < new Date(new Date().setHours(0, 0, 0, 0))) {
        showValidationError(taskDate, "The due date cannot be in the past.");
        return false;
    }

    if (!dateRegex.test(taskDate.value)) {
        showValidationError(taskDate, "Please select a valid due date.");
        return false;
    }

    errorMsg.textContent = "";
    return true;
}

function clearForm() {
    taskTitle.value = "";
    taskDesc.value = "";
    taskDate.value = "";
    taskPriority.value = "high";
    taskStatus.value = "pending";
    clearValidationError();
}
// #endregion -----------------

// #region Task CRUD:
function saveTask() {
    clearValidationError();

    try {
        if (!validateTitle()) {
            throw new Error("Invalid task title.");
        }

        if (!validateDesc()) {
            throw new Error("Invalid task description.");
        }

        if (!validateDate()) {
            throw new Error("Invalid due date.");
        }

        const title = taskTitle.value.trim();
        const description = taskDesc.value.trim();
        const dueDate = taskDate.value;
        const priority = taskPriority.value;
        const status = taskStatus.value;

        if (editingTaskId !== null) {
            const taskToUpdate = tasks.find((task) => task.id === editingTaskId);

            taskToUpdate.title = title;
            taskToUpdate.description = description;
            taskToUpdate.dueDate = dueDate;
            taskToUpdate.priority = priority;
            taskToUpdate.status = status;

            editingTaskId = null;
            addBtn.innerHTML = `<i class="bi bi-plus-circle"></i> Add Task`;
            showMessage(`Task "${title}" updated successfully!`);
        } else {
            tasks.push(new Task(title, description, dueDate, priority, status));
            showMessage(`Task "${title}" added successfully!`);
        }

        renderTasks();
        saveTasks();
        clearForm();
        checkReminders;
    } catch (error) {
        console.error(error.message);
    }
}

function editTask(id) {
    const task = tasks.find((task) => task.id === id);

    taskTitle.value = task.title;
    taskDesc.value = task.description;
    taskDate.value = task.dueDate;
    taskPriority.value = task.priority;
    taskStatus.value = task.status;

    editingTaskId = id;
    addBtn.innerHTML = `<i class="bi bi-pencil-square"></i> Update Task`;

    // Better UX
    taskTitle.focus();
    document.getElementById("add-form").scrollIntoView({ behavior: "smooth" });
}

function deleteTask(id) {
    const taskIndex = tasks.findIndex((task) => task.id === id);

    const toDelete = confirm("Are you sure you want to delete this task?");
    if (toDelete) {
        showMessage(`Task "${tasks[taskIndex].title}" deleted successfully!`);
        tasks.splice(taskIndex, 1);
        renderTasks();
        saveTasks();
    }
}

taskTitle.addEventListener("input", validateTitle);
taskDesc.addEventListener("input", validateDesc);
taskDate.addEventListener("change", validateDate);
addBtn.addEventListener("click", saveTask);
taskBox.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit-button")) {
        editTask(Number(event.target.dataset.id));
        return;
    }

    if (event.target.classList.contains("delete-button")) {
        deleteTask(Number(event.target.dataset.id));
        return;
    }
});
// #endregion -----------------

// #region Task Rendering:
const priorityClasses = {
    high: {
        badge: "high-priority",
        border: "high-box",
    },
    med: {
        badge: "med-priority",
        border: "med-box",
    },
    low: {
        badge: "low-priority",
        border: "low-box",
    },
};

const statusClasses = {
    pending: "pending-status",
    "in-progress": "in-progress-status",
    completed: "completed-status",
};

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function capitalizeText(text) {
    if (typeof text !== "string") {
        return "";
    }

    return text
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function renderTasks(taskList = tasks) {
    let html = "";

    if (tasks.length === 0) {
        taskBox.innerHTML = `
            <div class="text-center mt-5">
                <i class="bi bi-inbox fs-1"></i>
                <h3 class="mt-2">No Tasks Added Yet</h3>
                <p id="empty-task-list">Create your first task to get started.</p>
            </div>
        `;

        totalTasks.textContent = 0;
        pendingTasks.textContent = 0;
        inProgressTasks.textContent = 0;
        completedTasks.textContent = 0;

        return;
    }

    taskList.forEach((task) => {
        const priorityColor = priorityClasses[task.priority].badge;
        const borderColor = priorityClasses[task.priority].border;
        const statusColor = statusClasses[task.status] || "pending-status";

        html += `<article class="d-flex align-items-center ${borderColor}">
                    <div class="d-flex flex-grow-1">
                        <div class="flex-grow-1">
                            <div class="d-flex flex-row align-items-center gap-3 mb-1">
                                <h3 class="task-title">${task.title}</h3>
                                <p class="task-priority flex-shrink-0 ${priorityColor}">${capitalizeText(task.priority)}</p>
                            </div>
                            <p class="task-desc">${task.description}</p>
                            <p class="task-date"><i class="bi bi-calendar"></i> ${formatDate(task.dueDate)}</p>
                        </div>
                        <p class="task-status flex-shrink-0 align-self-start ${statusColor}">${capitalizeText(task.status)}</p>
                    </div>
                    <div class="task-buttons d-flex flex-row gap-2 ms-4">
                        <button title="Edit" class="edit-button bi bi-pen flex-shrink-0" data-id="${task.id}"></button>
                        <button title="Delete" class="delete-button bi bi-trash flex-shrink-0" data-id="${task.id}"></button>
                    </div>
                </article>`;
    });

    taskBox.innerHTML = html;
    // Statistics Update
    totalTasks.textContent = tasks.length;
    pendingTasks.textContent = tasks.filter((task) => task.status === "pending").length;
    inProgressTasks.textContent = tasks.filter((task) => task.status === "in-progress").length;
    completedTasks.textContent = tasks.filter((task) => task.status === "completed").length;
}
// #endregion -----------------

// #region Search & Filter:
function saveFilters() {
    sessionStorage.setItem("search", searchBox.value);
    sessionStorage.setItem("priority", filterPriority.value);
    sessionStorage.setItem("status", filterStatus.value);
}

function loadFilters() {
    searchBox.value = sessionStorage.getItem("search") || "";
    filterPriority.value = sessionStorage.getItem("priority") || "all";
    filterStatus.value = sessionStorage.getItem("status") || "all";

    filterTasks();
}

function filterTasks() {
    const keyword = searchBox.value.trim().toLowerCase();
    const selectedPriority = filterPriority.value;
    const selectedStatus = filterStatus.value;

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(keyword) || task.description.toLowerCase().includes(keyword);

        const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;

        const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;

        return matchesSearch && matchesPriority && matchesStatus;
    });

    saveFilters();
    renderTasks(filteredTasks);
}

function resetFilters() {
    searchBox.value = "";
    filterPriority.value = "all";
    filterStatus.value = "all";
    filterTasks();
}

searchBox.addEventListener("input", filterTasks);
filterPriority.addEventListener("change", filterTasks);
filterStatus.addEventListener("change", filterTasks);
resetButton.addEventListener("click", resetFilters);
// #endregion -----------------

// #region Task Reminder:
function checkReminders() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const reminderTasks = [];

    tasks.forEach((task) => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const dateDifference = dueDate - currentDate;
        const oneDay = 24 * 60 * 60 * 1000;

        if (dateDifference === oneDay) {
            reminderTasks.push(task.title);
        }
    });

    if (reminderTasks.length === 1) {
        showMessage(`Reminder: "${reminderTasks[0]}" is due tomorrow.`);
        return;
    }

    if (reminderTasks.length > 1) {
        showMessage(`Reminder: "${reminderTasks.length}" tasks are due tomorrow.`);
    }
}
// #endregion -----------------

loadTasks();
loadFilters();
renderTasks();
checkReminders();
