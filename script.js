document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authView = document.getElementById('auth-view');
    const taskManagerView = document.getElementById('task-manager-view');
    const authForm = document.getElementById('auth-form');
    const authNameInput = document.getElementById('auth-name');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const errorMessage = document.getElementById('error-message');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayDiv = document.querySelector('.user-display');
    const logoutButton = document.getElementById('logout-button');
    const addTaskButton = document.getElementById('add-task-button');
    const pendingList = document.getElementById('pending-tasks-list');
    const completedList = document.getElementById('completed-tasks-list');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskIdInput = document.getElementById('task-id');
    const modalTitle = document.getElementById('modal-title');
    const closeButton = document.querySelector('.close-button');
    const themeToggle = document.getElementById('theme-toggle');

    let currentUser = null;

    // --- LocalStorage Utility Functions ---
    const getStoredData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };

    const setStoredData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // --- Theme Toggle Bonus Feature ---
    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light-theme';
        document.body.className = savedTheme;
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark-theme') {
            icon.className = 'fas fa-sun'; // Sun icon for light theme switch
        } else {
            icon.className = 'fas fa-moon'; // Moon icon for dark theme switch
        }
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.className;
        const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
        
        document.body.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // --- View Rendering & Authentication ---

    const renderView = () => {
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            authView.classList.add('hidden');
            taskManagerView.classList.remove('hidden');
            userDisplayDiv.classList.remove('hidden');
            userDisplayName.textContent = `Hello, ${currentUser.name.split(' ')[0]}!`; // Show first name
            renderTasks();
        } else {
            currentUser = null;
            authView.classList.remove('hidden');
            taskManagerView.classList.add('hidden');
            userDisplayDiv.classList.add('hidden');
        }
    };

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        
        const name = authNameInput.value.trim();
        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value.trim();
        const users = getStoredData('users');

        let user = users.find(u => u.email === email);

        if (name) { // Registration
            if (user) {
                errorMessage.textContent = 'Registration failed: Email already exists. Please login.';
                return;
            }
            const newId = Date.now().toString(); 
            const newUser = { id: newId, name, email, password };
            users.push(newUser);
            setStoredData('users', users);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            renderView();
        } else { // Login
            if (!user || user.password !== password) {
                errorMessage.textContent = 'Login failed: Invalid email or password.';
                return;
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            renderView();
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        renderView();
    });

    // --- Task CRUD Operations ---

    const handleTaskSave = (e) => {
        e.preventDefault();
        
        const taskData = {
            id: taskIdInput.value ? parseInt(taskIdInput.value) : null,
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim()
        };
        
        if (!taskData.title || !taskData.description) return;

        let allTasks = getStoredData('tasks');
        
        if (taskData.id) {
            // Update
            const index = allTasks.findIndex(t => t.id === taskData.id);
            if (index > -1) {
                allTasks[index].title = taskData.title;
                allTasks[index].description = taskData.description;
            }
        } else {
            // Create
            const newTask = {
                id: Date.now(),
                userId: currentUser.id,
                title: taskData.title,
                description: taskData.description,
                status: 'pending' 
            };
            allTasks.push(newTask);
        }

        setStoredData('tasks', allTasks);
        renderTasks();
        taskModal.classList.add('hidden');
    };

    const deleteTask = (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        let allTasks = getStoredData('tasks').filter(t => t.id !== taskId);
        setStoredData('tasks', allTasks);
        renderTasks();
    };

    const toggleTaskStatus = (taskId) => {
        let allTasks = getStoredData('tasks');
        const task = allTasks.find(t => t.id === taskId);

        if (task) {
            // Toggle status (Pending -> Completed)
            task.status = 'completed'; 
            setStoredData('tasks', allTasks);
            renderTasks();
        }
    };

    // --- Task Card Generation ---

    const createTaskCard = (task, index, isPending) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const completeButton = isPending 
            ? `<button class="complete-btn" data-id="${task.id}" title="Mark as Completed"><i class="fas fa-check"></i> Complete</button>`
            : '';

        card.innerHTML = `
            <h4><span class="task-number">#${index + 1}</span>${task.title}</h4>
            <p>${task.description}</p>
            <div class="actions">
                <button class="edit-btn" data-id="${task.id}" title="Edit Task"><i class="fas fa-edit"></i> Edit</button>
                ${completeButton}
                <button class="delete-btn" data-id="${task.id}" title="Delete Task"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
        `;

        // Event Listeners
        card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        
        const completeBtn = card.querySelector('.complete-btn');
        if (completeBtn) completeBtn.addEventListener('click', () => toggleTaskStatus(task.id));

        return card;
    };

    // --- Main Task Renderer ---

    const renderTasks = () => {
        if (!currentUser) return;

        const allTasks = getStoredData('tasks');
        const userTasks = allTasks.filter(t => t.userId === currentUser.id);

        const pendingTasks = userTasks.filter(t => t.status === 'pending');
        const completedTasks = userTasks.filter(t => t.status === 'completed');

        pendingList.innerHTML = '';
        completedList.innerHTML = '';
        
        document.getElementById('pending-count').textContent = pendingTasks.length;
        document.getElementById('completed-count').textContent = completedTasks.length;

        // Render Pending
        if (pendingTasks.length === 0) {
            pendingList.innerHTML = '<p style="padding: 10px; opacity: 0.8;">Great! You have no pending tasks right now. 🎉</p>';
        } else {
            pendingTasks.forEach((task, index) => {
                pendingList.appendChild(createTaskCard(task, index, true));
            });
        }

        // Render Completed
        if (completedTasks.length === 0) {
            completedList.innerHTML = '<p style="padding: 10px; opacity: 0.8;">Finished tasks will appear here.</p>';
        } else {
            completedTasks.forEach((task, index) => {
                completedList.appendChild(createTaskCard(task, index, false));
            });
        }
    };


    // --- Modal Handlers ---

    const openAddModal = () => {
        modalTitle.textContent = 'Add New Task';
        taskIdInput.value = '';
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskModal.classList.remove('hidden');
    };

    const openEditModal = (task) => {
        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description;
        taskModal.classList.remove('hidden');
    };

    addTaskButton.addEventListener('click', openAddModal);
    closeButton.addEventListener('click', () => taskModal.classList.add('hidden'));
    taskForm.addEventListener('submit', handleTaskSave);
    
    // Hide modal when clicking outside
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) taskModal.classList.add('hidden');
    });

    // --- Initialization ---
    initializeTheme(); // Set the initial theme
    renderView(); // Check login status and render the correct view
});