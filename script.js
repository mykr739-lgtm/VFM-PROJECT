document.addEventListener('DOMContentLoaded', function() {
    
    var tasks = [];
    try {
        var stored = localStorage.getItem('vfm_tasks_pro');
        if (stored) tasks = JSON.parse(stored);
    } catch (e) { tasks = []; }

    var btnSubmitAdd = document.getElementById('btn-submit-add');
    var tasksContainer = document.getElementById('tasks-container');
    var emptyMessage = document.getElementById('empty-message');
    var headerStats = document.getElementById('header-stats');
    var searchInput = document.getElementById('search-input');
    var filterStatus = document.getElementById('filter-status');
    var filterPriority = document.getElementById('filter-priority');

    function saveTasks() {
        localStorage.setItem('vfm_tasks_pro', JSON.stringify(tasks));
        updateStats();
    }

    function formatDate(dateString) {
        if (!dateString) return 'نامشخص';
        try {
            return new Date(dateString).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch(e) { return 'نامشخص'; }
    }

    function updateStats() {
        var total = tasks.length;
        var completed = tasks.filter(function(t) { return t.progress === 'به پایان رسیده'; }).length;
        var inProgress = total - completed;
        headerStats.innerHTML = 
            '<div class="stat-item"><span>' + total + '</span><small>کل کارها</small></div>' +
            '<div class="stat-item"><span style="color: var(--warning)">' + inProgress + '</span><small>در جریان</small></div>' +
            '<div class="stat-item"><span style="color: var(--primary)">' + completed + '</span><small>انجام شده</small></div>';
    }

    function renderTasks() {
        var searchTerm = searchInput.value.trim().toLowerCase();
        var statusFilter = filterStatus.value;
        var priorityFilter = filterPriority.value;

        var filtered = tasks.filter(function(task) {
            var matchSearch = task.title.toLowerCase().indexOf(searchTerm) !== -1 || 
                              task.category.toLowerCase().indexOf(searchTerm) !== -1;
            var matchStatus = statusFilter === 'all' || 
                              (statusFilter === 'به پایان رسیده' && task.progress === 'به پایان رسیده') ||
                              (statusFilter === 'در جریان' && task.progress !== 'به پایان رسیده');
            var matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            return matchSearch && matchStatus && matchPriority;
        });

        filtered.sort(function(a, b) {
            if (a.progress === 'به پایان رسیده' && b.progress !== 'به پایان رسیده') return 1;
            if (a.progress !== 'به پایان رسیده' && b.progress === 'به پایان رسیده') return -1;
            return 0;
        });

        tasksContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            emptyMessage.classList.remove('hidden');
        } else {
            emptyMessage.classList.add('hidden');
        }

        filtered.forEach(function(task) {
            var isCompleted = task.progress === 'به پایان رسیده';
            var card = document.createElement('div');
            card.className = 'task-card' + (isCompleted ? ' completed' : '') + (task.priority === 'بالا' ? ' high-priority' : '');
            
            var checkBtn = '';
            if (!isCompleted) {
                checkBtn = '<button class="btn-icon btn-check" data-action="check" data-id="' + task.id + '" title="پایان"><i class="fa-solid fa-check-circle"></i></button>';
            }
            
            card.innerHTML = 
                '<div class="task-top">' +
                    '<div class="task-title">' + task.title + '</div>' +
                    '<div class="task-actions">' +
                        checkBtn +
                        '<button class="btn-icon btn-edit" data-action="edit" data-id="' + task.id + '" title="ویرایش"><i class="fa-solid fa-pen-to-square"></i></button>' +
                        '<button class="btn-icon" data-action="view" data-id="' + task.id + '" title="مشاهده"><i class="fa-solid fa-eye"></i></button>' +
                        '<button class="btn-icon btn-delete" data-action="delete" data-id="' + task.id + '" title="حذف"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>' +
                '<div class="task-meta">' +
                    '<span class="badge"><i class="fa-solid fa-folder"></i> ' + task.category + '</span>' +
                    '<span class="badge priority-' + task.priority + '"><i class="fa-solid fa-flag"></i> ' + task.priority + '</span>' +
                '</div>' +
                '<div class="progress-wrapper">' +
                    '<div class="progress-header"><span>وضعیت: ' + task.progress + '</span></div>' +
                    '<div class="progress-bar-bg"><div class="progress-bar-fill fill-' + task.progress + '"></div></div>' +
                '</div>' +
                '<div class="task-dates">' +
                    '<span><i class="fa-regular fa-calendar-plus"></i> ' + formatDate(task.start) + '</span>' +
                    '<span><i class="fa-regular fa-calendar-check"></i> ' + formatDate(task.end) + '</span>' +
                '</div>';
            
            tasksContainer.appendChild(card);
        });
    }

    // ثبت کار جدید - با کلیک مستقیم روی دکمه
    if (btnSubmitAdd) {
        btnSubmitAdd.addEventListener('click', function() {
            var title = document.getElementById('task-title').value.trim();
            var desc = document.getElementById('task-desc').value.trim();
            var start = document.getElementById('task-start').value;
            var end = document.getElementById('task-end').value;
            var category = document.getElementById('task-category').value.trim();
            var priority = document.getElementById('task-priority').value;
            var progress = document.getElementById('task-progress').value;

            if (!title || !desc || !start || !end || !category) {
                alert('لطفاً تمام فیلدها را پر کنید.');
                return;
            }

            var newTask = {
                id: Date.now(),
                title: title,
                description: desc,
                start: start,
                end: end,
                category: category,
                priority: priority,
                progress: progress
            };

            tasks.push(newTask);
            saveTasks();
            renderTasks();
            
            document.getElementById('add-task-form').reset();
            alert('کار با موفقیت ثبت شد!');
        });
    }

    // مدیریت دکمه‌های کارت
    tasksContainer.addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        
        var action = btn.getAttribute('data-action');
        var id = Number(btn.getAttribute('data-id'));
        if (!action || !id) return;

        if (action === 'delete') {
            if (confirm('حذف شود؟')) {
                tasks = tasks.filter(function(t) { return t.id !== id; });
                saveTasks();
                renderTasks();
            }
        } else if (action === 'check') {
            var task = tasks.find(function(t) { return t.id === id; });
            if (task) {
                task.progress = 'به پایان رسیده';
                saveTasks();
                renderTasks();
            }
        } else if (action === 'edit') {
            var task = tasks.find(function(t) { return t.id === id; });
            if (!task) return;
            document.getElementById('edit-task-id').value = task.id;
            document.getElementById('edit-title').value = task.title;
            document.getElementById('edit-desc').value = task.description;
            document.getElementById('edit-start').value = task.start;
            document.getElementById('edit-end').value = task.end;
            document.getElementById('edit-category').value = task.category;
            document.getElementById('edit-priority').value = task.priority;
            document.getElementById('edit-progress').value = task.progress;
            document.getElementById('edit-modal').classList.add('active');
        } else if (action === 'view') {
            var task = tasks.find(function(t) { return t.id === id; });
            if (!task) return;
            document.getElementById('view-modal-body').innerHTML = 
                '<p><strong>عنوان:</strong> ' + task.title + '</p>' +
                '<p><strong>توضیحات:</strong> ' + task.description + '</p>' +
                '<p><strong>دسته‌بندی:</strong> ' + task.category + '</p>' +
                '<p><strong>اولویت:</strong> ' + task.priority + '</p>' +
                '<p><strong>وضعیت:</strong> ' + task.progress + '</p>' +
                '<p><strong>تاریخ شروع:</strong> ' + formatDate(task.start) + '</p>' +
                '<p><strong>تاریخ پایان:</strong> ' + formatDate(task.end) + '</p>';
            document.getElementById('view-modal').classList.add('active');
        }
    });

    // فرم ویرایش
    document.getElementById('edit-task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var id = Number(document.getElementById('edit-task-id').value);
        var index = tasks.findIndex(function(t) { return t.id === id; });
        if (index !== -1) {
            tasks[index].title = document.getElementById('edit-title').value.trim();
            tasks[index].description = document.getElementById('edit-desc').value.trim();
            tasks[index].start = document.getElementById('edit-start').value;
            tasks[index].end = document.getElementById('edit-end').value;
            tasks[index].category = document.getElementById('edit-category').value.trim();
            tasks[index].priority = document.getElementById('edit-priority').value;
            tasks[index].progress = document.getElementById('edit-progress').value;
            saveTasks();
            renderTasks();
            closeModal('edit-modal');
        }
    });

    // جستجو و فیلتر
    var searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(renderTasks, 300);
    });
    filterStatus.addEventListener('change', renderTasks);
    filterPriority.addEventListener('change', renderTasks);

    // شروع
    updateStats();
    renderTasks();
});

// تابع بستن مودال (گلوبال)
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// بستن مودال با کلیک بیرون
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});