// Get elements
const taskInput = document.getElementById('taskInput');
const reminderTime = document.getElementById('reminderTime');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// Current filter
let currentFilter = 'all';

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize
renderTasks();
checkReminders();
setInterval(checkReminders, 60000); // Check every minute

// Add task
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        reminder: reminderTime.value || null,
        notified: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    taskInput.value = '';
    reminderTime.value = '';
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Save to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render tasks
function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const content = document.createElement('div');
        content.className = 'task-content';

        const text = document.createElement('div');
        text.className = 'task-text';
        text.textContent = task.text;

        content.appendChild(text);

        if (task.reminder) {
            const reminderDiv = document.createElement('div');
            reminderDiv.className = 'task-reminder';
            const reminderDate = new Date(task.reminder);
            reminderDiv.innerHTML = `🔔 ${reminderDate.toLocaleString()}`;
            content.appendChild(reminderDiv);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });

    updateStats();
}

// Update stats
function updateStats() {
    const activeTasks = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} remaining`;
}

// Clear completed tasks
clearCompleted.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
});

// Filter tasks
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Check for reminders
function checkReminders() {
    const now = new Date();

    tasks.forEach(task => {
        if (task.reminder && !task.notified && !task.completed) {
            const reminderDate = new Date(task.reminder);
            
            // If reminder time has passed
            if (reminderDate <= now) {
                task.notified = true;
                saveTasks();
                showNotification(task.text);
            }
        }
    });
}

// Show browser notification
function showNotification(taskText) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📝 Task Reminder', {
            body: taskText,
            icon: '📝',
            requireInteraction: true
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('📝 Task Reminder', {
                    body: taskText,
                    icon: '📝',
                    requireInteraction: true
                });
            }
        });
    }
    
    // Also show an alert as fallback
    alert(`⏰ Reminder: ${taskText}`);
}
