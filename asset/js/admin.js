/* document.addEventListener("DOMContentLoaded", () => {
    checkLoginState();

    // Login Form Submit
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('../backend/admin/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem('isAdmin', 'true');
                checkLoginState();
            } else {
                document.getElementById('loginError').textContent = data.message;
            }
        } catch (err) {
            console.error("Login error:", err);
        }
    });

    // Logout Button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('isAdmin');
        checkLoginState();
    });

    // Destination Form Submit (Add or Update)
    document.getElementById('destForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('destId').value;
        const payload = {
            id: id ? id : null,
            name: document.getElementById('destName').value,
            category: document.getElementById('destCategory').value,
            best_month: document.getElementById('destMonth').value,
            image_class: document.getElementById('destImageClass').value,
            description: document.getElementById('destDesc').value
        };

        const method = id ? 'PUT' : 'POST';
        try {
            const res = await fetch('../backend/admin/destinations_crud.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                bootstrap.Modal.getInstance(document.getElementById('destModal')).hide();
                loadAdminDestinations();
            }
        } catch (err) {
            console.error("Error saving destination:", err);
        }
    });
});

function checkLoginState() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (isAdmin) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        loadAdminDestinations();
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
    }
} */

async function loadAdminDestinations() {
    try {
        const res = await fetch('../backend/admin/destinations_crud.php');
        const data = await res.json();
        const tbody = document.getElementById('destTableBody');
        tbody.innerHTML = '';

        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td><strong>${item.name}</strong></td>
                    <td><span class="badge bg-secondary">${item.category}</span></td>
                    <td>${item.best_month}</td>
                    <td><code>${item.image_class}</code></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick='editDestination(${JSON.stringify(item)})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteDestination(${item.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading destinations:", err);
    }
}

function resetForm() {
    document.getElementById('destForm').reset();
    document.getElementById('destId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Destination';
}

function editDestination(item) {
    document.getElementById('destId').value = item.id;
    document.getElementById('destName').value = item.name;
    document.getElementById('destCategory').value = item.category;
    document.getElementById('destMonth').value = item.best_month;
    document.getElementById('destImageClass').value = item.image_class;
    document.getElementById('destDesc').value = item.description;
    document.getElementById('modalTitle').textContent = 'Edit Destination';

    new bootstrap.Modal(document.getElementById('destModal')).show();
}

async function deleteDestination(id) {
    if (confirm('Are you sure you want to delete this destination?')) {
        try {
            const res = await fetch('../backend/admin/destinations_crud.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await res.json();
            if (result.success) {
                loadAdminDestinations();
            }
        } catch (err) {
            console.error("Error deleting destination:", err);
        }
    }
}