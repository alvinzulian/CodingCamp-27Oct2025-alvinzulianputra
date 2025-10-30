document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil elemen HTML yang dibutuhkan
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const filterBtn = document.getElementById('filter-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');

    // Elemen untuk Modal Kustom
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');


    // Tugas-tugas disimpan di sini
    let tasks = [];
    // Status filter saat ini
    let currentFilter = 'ALL';

    // --- Fungsionalitas Toast Notification ---
    function showToast(message) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.classList.add('toast-notification');
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
    // ------------------------------------------

    // --- Fungsionalitas Penyimpanan Data (localStorage) ---
    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }
    loadTasks();
    // ----------------------------------------------------

    // --- Fungsionalitas Cek Overdue (BARU) ---
    function isOverdue(task) {
        // Tugas yang sudah selesai tidak bisa overdue
        if (task.completed) return false;

        // Normalisasi tanggal hari ini ke tengah malam untuk perbandingan hari yang akurat
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buat objek Date dari string YYYY-MM-DD
        const taskDueDate = new Date(task.dueDate);
        
        // Tugas dianggap Overdue jika tanggal jatuh tempo kurang dari hari ini
        return taskDueDate < today;
    }
    // ------------------------------------------


    // Fungsi untuk menampilkan daftar tugas
    function renderTasks() {
        taskList.innerHTML = ''; // Hapus semua isi yang ada di tbody

        // 2. Logika FILTER
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'PENDING') return !task.completed && !isOverdue(task);
            if (currentFilter === 'COMPLETED') return task.completed;
            if (currentFilter === 'OVERDUE') return isOverdue(task); // Filter Overdue
            return true; // 'ALL'
        });

        // Tentukan pesan jika tidak ada tugas yang ditemukan
        if (filteredTasks.length === 0) {
            let message = "No task found";
            if (currentFilter === 'PENDING') {
                message = "No pending task found";
            } else if (currentFilter === 'COMPLETED') {
                message = "No completed task found";
            } else if (currentFilter === 'OVERDUE') {
                message = "No overdue task found";
            }
            const noTaskRow = document.createElement('tr');
            noTaskRow.innerHTML = `<td colspan="4" class="no-task-message">${message}</td>`;
            taskList.appendChild(noTaskRow);
            return;
        }

        // 3. Menampilkan Daftar Tugas (hasil filter)
        filteredTasks.forEach((task) => {
            
            // Logika Status Tugas (diperbarui)
            const overdue = isOverdue(task);
            let statusText;
            let taskClass = '';

            if (task.completed) {
                statusText = 'Completed';
                taskClass = 'completed-task';
            } else if (overdue) {
                statusText = 'Overdue';
                taskClass = 'overdue-task'; // Kelas CSS baru
            } else {
                statusText = 'Pending';
                taskClass = '';
            }

            const completeButtonText = task.completed ? 'Undo' : 'Complete';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="${taskClass}">${task.name}</td>
                <td>${task.dueDate || '-'}</td>
                <td>${statusText}</td>
                <td>
                    <button class="action-btn complete-btn" data-id="${task.id}">
                        ${completeButtonText}
                    </button>
                    <button class="action-btn delete-btn" data-id="${task.id}">
                        Delete
                    </button>
                </td>
            `;
            
            taskList.appendChild(row);
        });
        
        saveTasks();
    }

    // Fungsi untuk menambah tugas baru (Formulir Input)
    function addTask() {
        const taskName = taskInput.value.trim();
        const dueDate = dueDateInput.value;

        if (taskName === "") {
            showToast("⚠️ Nama tugas tidak boleh kosong!");
            return;
        }
        
        // Validasi Tanggal Jatuh Tempo (TAMBAHAN)
        if (dueDate === "") {
            showToast("⚠️ Tanggal batas waktu tidak boleh kosong!");
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            name: taskName,
            dueDate: dueDate,
            completed: false
        };

        tasks.push(newTask);
        
        taskInput.value = '';
        dueDateInput.value = '';
        
        renderTasks();
        showToast("✅ Tugas berhasil ditambahkan!");
    }

    
    // --- Fungsionalitas FILTER (diperbarui untuk Overdue) ---
    function toggleFilter() {
        if (currentFilter === 'ALL') {
            currentFilter = 'PENDING';
            filterBtn.textContent = 'FILTER (Pending)';
        } else if (currentFilter === 'PENDING') {
            currentFilter = 'COMPLETED';
            filterBtn.textContent = 'FILTER (Completed)';
        } else if (currentFilter === 'COMPLETED') { 
            currentFilter = 'OVERDUE';
            filterBtn.textContent = 'FILTER (Overdue)'; // Status filter Overdue
        } else {
            currentFilter = 'ALL';
            filterBtn.textContent = 'FILTER';
        }
        renderTasks();
    }
    
    // --- Fungsionalitas HAPUS SEMUA (MODAL HANDLER) ---
    function showDeleteModal() {
        if (tasks.length === 0) return;
        deleteModal.classList.add('visible');
    }

    function hideDeleteModal() {
        deleteModal.classList.remove('visible');
    }
    
    function executeDeleteAllTasks() {
        tasks = [];
        currentFilter = 'ALL';
        filterBtn.textContent = 'FILTER';
        renderTasks();
        hideDeleteModal();
        showToast("🗑️ Semua tugas telah dihapus!");
    }


    // --- Event Listeners ---
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterBtn.addEventListener('click', toggleFilter);

    // Menampilkan modal saat tombol Hapus Semua diklik
    deleteAllBtn.addEventListener('click', showDeleteModal);
    
    // Event listener untuk tombol di modal
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', executeDeleteAllTasks);


    // Delegasi Event untuk tombol Complete/Delete di dalam tabel
    taskList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('action-btn')) {
            const taskId = target.getAttribute('data-id');
            const taskIndex = tasks.findIndex(t => t.id === taskId);

            if (taskIndex === -1) return;

            if (target.classList.contains('complete-btn')) {
                tasks[taskIndex].completed = !tasks[taskIndex].completed;
                const status = tasks[taskIndex].completed ? "selesai" : "ditunda";
                showToast(`Status tugas diubah menjadi ${status}!`);
            } else if (target.classList.contains('delete-btn')) {
                tasks.splice(taskIndex, 1);
                showToast("❌ Tugas berhasil dihapus!");
            }

            renderTasks();
        }
    });
    
    // Inisialisasi tampilan saat pertama kali dimuat
    renderTasks();
});