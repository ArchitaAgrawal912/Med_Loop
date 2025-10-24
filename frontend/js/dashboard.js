// File: frontend/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    console.log("Dashboard JS Loaded"); // Debug Log 1

    // --- Part 1: Common Elements & Variables ---
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    console.log("User Role:", userRole); // Debug Log 2 (Crucial!)
    console.log("Token:", token ? "Exists" : "MISSING"); // Debug Log 3

    // Logout Buttons (Mobile and Desktop)
    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        alert('You have been logged out.');
        window.location.href = 'index.html';
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', logout);

    // Helper function for formatting dates
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Corrected from getUTCFullMonth
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Part 2: Admin Dashboard Logic ---
    const userListDiv = document.getElementById('pending-users-list');
    if (userRole === 'admin' && userListDiv) {
        console.log("Running ADMIN logic..."); // Debug Log 4

        async function fetchPendingUsers() {
            try {
                const response = await fetch('http://localhost:3000/api/admin/pending', {
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) {
                    const errData = await response.json(); // Get error message from backend
                    throw new Error(errData.msg || 'Failed to fetch users');
                }
                const users = await response.json();
                displayUsers(users);
            } catch (err) {
                 console.error("Error fetching pending users:", err);
                userListDiv.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
            }
        }

        function displayUsers(users) {
            userListDiv.innerHTML = '';
            if (users.length === 0) {
                userListDiv.innerHTML = '<p>No users pending verification.</p>';
                return;
            }
            users.forEach(user => {
                const userCard = document.createElement('div');
                userCard.className = 'p-4 bg-white shadow rounded-lg flex justify-between items-center';
                const proofPath = user.registrationProof || user.licenceProof;
                // Basic check if proofPath exists
                const proofLink = proofPath ? `<a href="http://localhost:3000/${proofPath}" target="_blank" class="text-blue-500 hover:underline">View PDF</a>` : 'No Proof Uploaded';
                userCard.innerHTML = `
                    <div>
                        <h3 class="text-lg font-bold">${user.role.toUpperCase()}: ${user.organizationName || user.pharmacyName || 'N/A'}</h3>
                        <p class="text-gray-600">${user.email || 'N/A'}</p>
                        <p>Contact: ${user.contactPersonName || 'N/A'} (${user.phoneNumber || 'N/A'})</p>
                        <p>Reg/Licence No: ${user.registrationNumber || user.licenceNumber || 'N/A'}</p>
                        <p>Proof: ${proofLink}</p>
                    </div>
                `;
                const approveBtn = document.createElement('button');
                approveBtn.innerText = 'Approve';
                approveBtn.className = 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700';
                approveBtn.addEventListener('click', () => approveUser(user._id));
                userCard.appendChild(approveBtn);
                userListDiv.appendChild(userCard);
            });
        }

        async function approveUser(userId) {
            if (!confirm('Are you sure you want to approve this user?')) return;
            try {
                const response = await fetch(`http://localhost:3000/api/admin/verify/${userId}`, {
                    method: 'PUT',
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.msg || 'Failed to approve user');
                }
                alert('User approved successfully!');
                fetchPendingUsers(); // Refresh the list
            } catch (err) {
                console.error("Error approving user:", err);
                alert(`Error: ${err.message}`);
            }
        }

        fetchPendingUsers(); // Initial load for admin
    }

    // --- Part 3: Pharmacy Dashboard Logic ---
    const navHomePharma = document.getElementById('nav-home'); // Check element existence early

    if (userRole === 'pharmacy') {
        console.log("Running PHARMACY logic..."); // Debug Log 5

        // Get the rest of the elements only if we are on the pharmacy page
        const navManagePharma = document.getElementById('nav-manage');
        const navOrdersPharma = document.getElementById('nav-orders');
        const pageHome = document.getElementById('page-home');
        const pageManage = document.getElementById('page-manage');
        const pageOrders = document.getElementById('page-orders');
        const allNavLinks = document.querySelectorAll('.nav-link'); // Assumes pharmacy nav links have this class
        const allPages = document.querySelectorAll('.page-content');
        const modal = document.getElementById('medicine-modal');
        const medicineForm = document.getElementById('medicine-form');
        const tableBody = document.getElementById('medicine-table-body');
        const ordersListDiv = document.getElementById('pending-orders-list');

        // Check if essential elements exist - crucial for preventing errors
        if (!navHomePharma || !navManagePharma || !navOrdersPharma || !pageHome || !pageManage || !pageOrders || !modal || !medicineForm || !tableBody || !ordersListDiv) {
             console.error("CRITICAL ERROR: One or more pharmacy HTML elements not found! Check IDs in pharmacy_dashboard.html");
        } else {
             // --- B: Page Navigation ---
            function showPage(pageId) {
                allPages.forEach(p => p.classList.add('hidden'));
                allNavLinks.forEach(link => link.classList.remove('bg-blue-700')); // Use specific selector if needed
                const pageToShow = document.getElementById(pageId);
                const linkToActivate = document.getElementById(pageId.replace('page', 'nav'));
                if (pageToShow) pageToShow.classList.remove('hidden');
                if (linkToActivate) linkToActivate.classList.add('bg-blue-700');
                // Fetch data when showing specific pages
                if (pageId === 'page-home') fetchDashboardStats();
                if (pageId === 'page-manage') fetchMedicineTable();
                if (pageId === 'page-orders') fetchPendingOrders();
            }
            navHomePharma.addEventListener('click', (e) => { e.preventDefault(); showPage('page-home'); });
            navManagePharma.addEventListener('click', (e) => { e.preventDefault(); showPage('page-manage'); });
            navOrdersPharma.addEventListener('click', (e) => { e.preventDefault(); showPage('page-orders'); });
            const viewAllBtn = document.getElementById('btn-view-all-quick');
            if(viewAllBtn) viewAllBtn.addEventListener('click', () => showPage('page-manage'));

            // --- C: Modal Control ---
            const modalCloseBtn = document.getElementById('modal-close');
            const modalCancelBtn = document.getElementById('modal-cancel');
            const openModalBtns = [
                document.getElementById('btn-add-new-quick'),
                document.getElementById('btn-add-new-main')
            ];
            const modalTitle = document.getElementById('modal-title');
            const modalSubmitBtn = document.getElementById('modal-submit');
            const medicineIdField = document.getElementById('medicine-id');
            const openModal = () => {
                medicineForm.reset();
                medicineIdField.value = '';
                modalTitle.innerText = 'Add New Medicine';
                modalSubmitBtn.innerText = 'Add Medicine';
                const stockInRadio = document.getElementById('stock-in');
                if(stockInRadio) stockInRadio.checked = true;
                modal.classList.remove('hidden');
                document.body.classList.add('modal-active');
            };
            const closeModal = () => {
                modal.classList.add('hidden');
                document.body.classList.remove('modal-active');
            };
            openModalBtns.forEach(btn => { if(btn) btn.addEventListener('click', openModal); });
            if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
            if(modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

            // --- D: Dashboard Home (Stats) ---
            async function fetchDashboardStats() {
                try {
                    const response = await fetch('http://localhost:3000/api/medicines/stats', {
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Could not fetch stats');
                    const stats = await response.json();
                    const welcomeHeading = document.getElementById('welcome-heading');
                    if(welcomeHeading) welcomeHeading.innerText = `Welcome, ${stats.pharmacyName || 'Pharmacy'} 👋`; // Added fallback
                    const statsTotal = document.getElementById('stats-total');
                    if(statsTotal) statsTotal.innerText = stats.totalMedicines;
                    const statsInStock = document.getElementById('stats-in-stock');
                    if(statsInStock) statsInStock.innerText = stats.inStock;
                    const statsOutOfStock = document.getElementById('stats-out-of-stock');
                    if(statsOutOfStock) statsOutOfStock.innerText = stats.outOfStock;
                } catch (err) {
                    console.error("Error fetching stats:", err);
                    const welcomeHeading = document.getElementById('welcome-heading');
                    if(welcomeHeading) welcomeHeading.innerText = 'Welcome! (Could not load stats)';
                }
            }

            // --- E: Manage Medicines (Table) ---
            async function fetchMedicineTable() {
                try {
                    const response = await fetch('http://localhost:3000/api/medicines/my-stock', {
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Could not fetch medicines');
                    const medicines = await response.json();
                    tableBody.innerHTML = '';
                    if (medicines.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Your inventory is empty.</td></tr>';
                        return;
                    }
                    medicines.forEach(med => {
                        const tr = document.createElement('tr');
                        tr.className = 'border-b border-gray-200';
                        const isOutOfStock = med.stockStatus === 'Out of Stock';
                        tr.innerHTML = `
                            <td class="p-3 font-medium">${med.name || 'N/A'}</td>
                            <td class="p-3 text-gray-700">${med.type || 'N/A'}</td>
                            <td class="p-3 text-gray-700">${formatDate(med.expiryDate)}</td>
                            <td class="p-3 font-semibold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}">
                                ${med.stockStatus || 'N/A'}
                            </td>
                            <td class="p-3">
                                <button class="toggle-stock-btn text-xs ${isOutOfStock ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded hover:opacity-80" data-id="${med._id}">
                                    Mark as ${isOutOfStock ? 'In Stock' : 'Out of Stock'}
                                </button>
                                <button class="edit-btn text-xs bg-blue-500 text-white px-2 py-1 rounded hover:opacity-80 ml-2" data-id="${med._id}">
                                    ✏️ Edit
                                </button>
                                <button class="delete-btn text-xs bg-gray-500 text-white px-2 py-1 rounded hover:opacity-80 ml-2" data-id="${med._id}">
                                    🗑️ Delete
                                </button>
                            </td>
                        `;
                        tableBody.appendChild(tr);
                    });
                } catch (err) {
                    console.error("Error fetching medicine table:", err);
                    tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
                }
            }
            medicineForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const medId = medicineIdField.value;
                const isEditMode = !!medId;
                const formData = {
                    name: document.getElementById('medicine-name').value,
                    type: document.getElementById('medicine-type').value,
                    expiryDate: document.getElementById('medicine-expiry').value,
                    quantity: document.getElementById('medicine-quantity').value,
                    price: document.getElementById('medicine-price').value || null,
                    stockStatus: document.querySelector('input[name="stockStatus"]:checked').value
                };
                // Basic validation
                if (!formData.name || !formData.type || !formData.expiryDate || !formData.quantity || !formData.stockStatus) {
                    return alert('Please fill all required fields.');
                }
                const url = isEditMode ? `http://localhost:3000/api/medicines/${medId}` : 'http://localhost:3000/api/medicines';
                const method = isEditMode ? 'PUT' : 'POST';
                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                        body: JSON.stringify(formData)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.msg || 'Form submission failed');
                    alert(result.msg || `Medicine ${isEditMode ? 'updated' : 'added'}!`);
                    closeModal();
                    fetchAllPharmacyData(); // Use combined fetch function
                } catch (err) {
                    console.error("Error submitting medicine form:", err);
                    alert(`Error: ${err.message}`);
                }
             });
            tableBody.addEventListener('click', async (e) => {
                const btn = e.target.closest('button'); // Use closest to handle clicks inside button icon
                if(!btn) return; // Exit if click wasn't on or inside a button

                const id = btn.dataset.id;
                if (!id) return; // Exit if button has no data-id

                // Toggle Stock
                if (btn.classList.contains('toggle-stock-btn')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/medicines/stock/${id}`, {
                            method: 'PUT',
                            headers: { 'x-auth-token': token }
                        });
                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.msg || 'Failed to toggle stock');
                        }
                        fetchAllPharmacyData(); // Use combined fetch function
                    } catch (err) {
                        console.error("Error toggling stock:", err);
                        alert(`Error: ${err.message}`);
                    }
                }
                // Edit
                else if (btn.classList.contains('edit-btn')) {
                    try {
                        const response = await fetch('http://localhost:3000/api/medicines/my-stock', {
                            headers: { 'x-auth-token': token }
                        });
                        if (!response.ok) throw new Error('Could not fetch medicine details for edit');
                        const medicines = await response.json();
                        const medToEdit = medicines.find(m => m._id === id);
                        if (medToEdit) {
                            medicineIdField.value = medToEdit._id;
                            document.getElementById('medicine-name').value = medToEdit.name;
                            document.getElementById('medicine-type').value = medToEdit.type;
                            document.getElementById('medicine-expiry').value = formatDate(medToEdit.expiryDate);
                            document.getElementById('medicine-quantity').value = medToEdit.quantity;
                            document.getElementById('medicine-price').value = medToEdit.price;
                            const stockRadio = document.getElementById(medToEdit.stockStatus === 'In Stock' ? 'stock-in' : 'stock-out');
                            if(stockRadio) stockRadio.checked = true;
                            modalTitle.innerText = 'Edit Medicine';
                            modalSubmitBtn.innerText = 'Update Medicine';
                            modal.classList.remove('hidden');
                            document.body.classList.add('modal-active');
                        } else {
                            alert("Error: Could not find medicine details.")
                        }
                    } catch(err) {
                         console.error("Error preparing edit:", err);
                         alert(`Error preparing edit: ${err.message}`);
                    }
                }
                // Delete
                else if (btn.classList.contains('delete-btn')) {
                    if (!confirm('Are you sure you want to delete this medicine?')) return;
                    try {
                        const response = await fetch(`http://localhost:3000/api/medicines/${id}`, {
                            method: 'DELETE',
                            headers: { 'x-auth-token': token }
                        });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.msg || 'Failed to delete');
                        alert(result.msg || 'Medicine deleted');
                        fetchAllPharmacyData(); // Use combined fetch function
                    } catch (err) {
                         console.error("Error deleting medicine:", err);
                        alert(`Error: ${err.message}`);
                    }
                }
            });

            // --- F: Pending Orders Logic ---
            async function fetchPendingOrders() {
                ordersListDiv.innerHTML = '<p>Loading pending orders...</p>';
                try {
                    const response = await fetch('http://localhost:3000/api/orders/pharmacy', {
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) {
                         const errData = await response.json();
                         throw new Error(errData.msg || 'Failed to fetch orders');
                    }
                    const orders = await response.json();
                    displayOrders(orders);
                } catch (err) {
                    console.error("Error fetching orders:", err);
                    ordersListDiv.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
                }
            }
            function displayOrders(orders) {
                ordersListDiv.innerHTML = '';
                const pendingOrders = orders.filter(order => order.status === 'Pending');
                if (pendingOrders.length === 0) {
                    ordersListDiv.innerHTML = '<p>No pending orders.</p>';
                    return;
                }
                pendingOrders.forEach(order => {
                    const orderCard = document.createElement('div');
                    orderCard.className = 'p-4 bg-white shadow rounded-lg';
                    // Safely access nested properties
                    const medName = order.medicine ? order.medicine.name : 'N/A';
                    const medPrice = order.medicine ? order.medicine.price || 'N/A' : 'N/A';
                    const userName = order.user ? order.user.name : 'N/A';
                    const userEmail = order.user ? order.user.email : 'N/A';
                    const userPhone = order.userDetails ? order.userDetails.phoneNumber || 'Not Provided' : 'N/A';
                    const userAddress = order.user ? order.user.address || 'Not Provided' : 'N/A';

                    orderCard.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-bold">Order ID: ${order._id.slice(-6)}</h3>
                                <p class="text-gray-700 font-semibold">Medicine: ${medName} (Price: ₹${medPrice})</p>
                                <p class="text-sm text-gray-600">Ordered By: ${userName} (${userEmail})</p>
                                <p class="text-sm text-gray-600">Contact: ${userPhone}</p>
                                <p class="text-sm text-gray-600">Address: ${userAddress}</p>
                                <p class="text-sm text-gray-500">Received: ${new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <div class="flex flex-col space-y-2">
                                 <button class="update-order-status-btn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm" data-id="${order._id}" data-status="Accepted">
                                    Accept Order
                                </button>
                                 <button class="update-order-status-btn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm" data-id="${order._id}" data-status="Rejected">
                                    Reject Order
                                </button>
                            </div>
                        </div>
                    `;
                    ordersListDiv.appendChild(orderCard);
                });
            }
            ordersListDiv.addEventListener('click', async (e) => {
                const btn = e.target.closest('button.update-order-status-btn');
                if (!btn) return; // Exit if not the target button

                const orderId = btn.dataset.id;
                const newStatus = btn.dataset.status;
                if (!orderId || !newStatus) return;

                if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this order?`)) return;

                try {
                    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.msg || 'Failed to update status');
                    alert(`Order ${newStatus.toLowerCase()} successfully!`);
                    fetchPendingOrders(); // Refresh the list
                } catch (err) {
                     console.error("Error updating order status:", err);
                     alert(`Error: ${err.message}`);
                }
            });

            // --- G: Initial Data Load for Pharmacy ---
            function fetchAllPharmacyData() { // Combined fetch for pharmacy
                fetchDashboardStats();
                fetchMedicineTable();
                fetchPendingOrders(); // Load all data needed across pharmacy pages
            }
            showPage('page-home'); // Start on Dashboard Home, initial fetch happens in showPage
        } // End check for essential pharmacy elements
    } // End of pharmacy-only logic

    // --- Part 4: User Dashboard Logic ---
    const navMyMedsUser = document.getElementById('nav-my-medicines'); // Check element existence early

    if (userRole === 'user') {
        console.log("Running USER logic..."); // Debug Log 6

        // Get the rest of the elements only if we are on the user page
        const searchFormUser = document.getElementById('search-medicine-form');
        const allNavLinks = document.querySelectorAll('.nav-link');
        const allPages = document.querySelectorAll('.page-content');
        const myMedsTableBody = document.getElementById('my-medicines-table-body');
        const addMedModal = document.getElementById('add-medicine-modal');
        const addMedForm = document.getElementById('add-medicine-form');
        const searchResultsDiv = document.getElementById('medicine-results-list');
        const donateStep1 = document.getElementById('donate-step-1');
        const medChecklist = document.getElementById('donation-medicine-list');
        const centerList = document.getElementById('donation-center-list');
        const btnToStep2 = document.getElementById('btn-to-step-2');
        const navSearchUser = document.getElementById('nav-search');
        const navDonateUser = document.getElementById('nav-donate');

        // Check essential elements
         if (!navMyMedsUser || !searchFormUser || !myMedsTableBody || !addMedModal || !addMedForm || !searchResultsDiv || !donateStep1 || !medChecklist || !centerList || !btnToStep2 || !navSearchUser || !navDonateUser) {
              console.error("CRITICAL ERROR: One or more user HTML elements not found! Check IDs in user_dashboard.html");
         } else {
            // --- A: Page Navigation ---
            function showPage(pageId) {
                allPages.forEach(p => p.classList.add('hidden'));
                allNavLinks.forEach(link => link.classList.remove('bg-blue-700'));
                const pageToShow = document.getElementById(pageId);
                const linkToActivate = document.getElementById(pageId.replace('page', 'nav'));
                if (pageToShow) pageToShow.classList.remove('hidden');
                if (linkToActivate) linkToActivate.classList.add('bg-blue-700');
                // Fetch data for the specific page being shown
                if (pageId === 'page-my-medicines') fetchMyMedicines();
                if (pageId === 'page-donate') fetchEligibleMedicines();
            }
            navMyMedsUser.addEventListener('click', (e) => { e.preventDefault(); showPage('page-my-medicines'); });
            navSearchUser.addEventListener('click', (e) => { e.preventDefault(); showPage('page-search'); });
            navDonateUser.addEventListener('click', (e) => { e.preventDefault(); showPage('page-donate'); });

            // --- B: "My Medicines" Page Logic ---
            async function fetchMyMedicines() {
                try {
                    const response = await fetch('http://localhost:3000/api/user-medicines', {
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Could not fetch your medicines');
                    const medicines = await response.json();
                    myMedsTableBody.innerHTML = '';
                    if (medicines.length === 0) {
                        myMedsTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">You have not added any medicines.</td></tr>';
                        return medicines; // Return empty array
                    }
                    const today = new Date().setHours(0, 0, 0, 0);
                    medicines.forEach(med => {
                        const expiry = new Date(med.expiryDate);
                        const diffTime = expiry - today;
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        let status, statusColor;
                        if (daysLeft < 0) {
                            status = 'Expired'; statusColor = 'text-red-600';
                        } else if (daysLeft <= 30) {
                            status = 'Expiring Soon'; statusColor = 'text-yellow-600';
                        } else {
                            status = 'Fresh'; statusColor = 'text-green-600';
                        }
                        const tr = document.createElement('tr');
                        tr.className = 'border-b border-gray-200';
                        tr.innerHTML = `
                            <td class="p-3 font-medium">${med.medicineName} ${med.brand ? `(${med.brand})` : ''}</td>
                            <td class="p-3 text-gray-700">${expiry.toLocaleDateString()}</td>
                            <td class="p-3 font-semibold ${statusColor}">${daysLeft} days</td>
                            <td class="p-3 font-semibold ${statusColor}">${status}</td>
                            <td class="p-3">
                                <button class="delete-med-btn text-xs bg-red-500 text-white px-2 py-1 rounded hover:opacity-80" data-id="${med._id}">
                                    🗑️ Delete
                                </button>
                            </td>
                        `;
                        myMedsTableBody.appendChild(tr);
                    });
                    return medicines; // Return the fetched data
                } catch (err) {
                    console.error("Error fetching my medicines:", err);
                    myMedsTableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
                    return []; // Return empty on error
                }
            }
            myMedsTableBody.addEventListener('click', async (e) => {
                const btn = e.target.closest('button.delete-med-btn');
                if (btn) {
                    const id = btn.dataset.id;
                    if (!confirm('Are you sure you want to delete this medicine?')) return;
                    try {
                        const response = await fetch(`http://localhost:3000/api/user-medicines/${id}`, {
                            method: 'DELETE',
                            headers: { 'x-auth-token': token }
                        });
                        if (!response.ok) throw new Error('Failed to delete');
                        alert('Medicine deleted.');
                        fetchMyMedicines(); // Refresh table
                    } catch (err) {
                        console.error("Error deleting medicine:", err);
                        alert(`Error: ${err.message}`);
                    }
                }
            });
            const openAddMedModal = () => { if(addMedModal) addMedModal.classList.remove('hidden'); };
            const closeAddMedModal = () => { if(addMedModal) addMedModal.classList.add('hidden'); };
            const addMedBtn = document.getElementById('btn-add-medicine');
            if(addMedBtn) addMedBtn.addEventListener('click', openAddMedModal);
            document.querySelectorAll('.modal-close-add').forEach(btn => btn.addEventListener('click', closeAddMedModal));
            addMedForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(addMedForm);
                // Basic validation
                 if (!formData.get('medicineName') || !formData.get('expiryDate') || !formData.get('quantity')) {
                     return alert('Please fill all required fields.');
                 }
                try {
                    const response = await fetch('http://localhost:3000/api/user-medicines', {
                        method: 'POST',
                        headers: { 'x-auth-token': token },
                        body: formData
                    });
                     const result = await response.json(); // Always try to parse JSON
                    if (!response.ok) throw new Error(result.msg || 'Failed to add medicine');
                    alert('Medicine added to your list!');
                    addMedForm.reset();
                    closeAddMedModal();
                    fetchMyMedicines(); // Refresh table
                } catch (err) {
                    console.error("Error adding medicine:", err);
                    alert(`Error: ${err.message}`);
                }
            });

            // --- C: "Search Medicine" Page Logic ---
            searchFormUser.addEventListener('submit', async (e) => {
                 e.preventDefault();
                 const searchInput = document.getElementById('search-input').value;
                 if (!searchInput) return;
                 await fetchMedicineResults(searchInput);
             });
            async function fetchMedicineResults(searchQuery) {
                if(!searchResultsDiv) return;
                searchResultsDiv.innerHTML = '<p>Searching...</p>';
                try {
                    const response = await fetch(`http://localhost:3000/api/medicines?search=${searchQuery}`, {
                        method: 'GET',
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Failed to search');
                    const results = await response.json();
                    displayResults(results);
                } catch (err) {
                    console.error("Error searching medicine:", err);
                    searchResultsDiv.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
                }
            }
            function displayResults(results) {
                 if(!searchResultsDiv) return;
                searchResultsDiv.innerHTML = '';
                if (results.length === 0) {
                    searchResultsDiv.innerHTML = '<p>No results found for that medicine.</p>';
                    return;
                }
                results.forEach(med => {
                    const resDiv = document.createElement('div');
                    resDiv.className = 'p-4 bg-gray-100 rounded-lg';
                    let statusColor = 'text-green-600';
                    if (med.stockStatus === 'Low Stock') statusColor = 'text-yellow-600';
                    else if (med.stockStatus === 'Out of Stock') statusColor = 'text-red-600';
                    // Safe navigation for potentially missing pharmacy data
                    const pharmacyName = med.pharmacy ? med.pharmacy.pharmacyName : 'N/A';
                    const pharmacyAddress = med.pharmacy ? `${med.pharmacy.address || ''}, ${med.pharmacy.city || ''} - ${med.pharmacy.pincode || ''}` : 'N/A';
                    const pharmacyPhone = med.pharmacy ? med.pharmacy.phoneNumber || 'N/A' : 'N/A';
                    const pharmacyHours = med.pharmacy ? med.pharmacy.operatingHours || 'N/A' : 'N/A';
                    const pharmacyId = med.pharmacy ? med.pharmacy._id : null; // Need pharmacy ID

                    resDiv.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="text-lg font-bold">${med.name}</h3>
                                <p class="font-semibold text-gray-700">${pharmacyName}</p>
                            </div>
                            <div>
                                <span class="font-bold ${statusColor} text-lg">${med.stockStatus}</span>
                                <p class="font-bold text-gray-800 text-lg">₹${med.price || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="mt-2 text-gray-600">
                            <p><b>Expiry:</b> ${formatDate(med.expiryDate)}</p>
                            <p>${pharmacyAddress}</p>
                            <p>Call: ${pharmacyPhone} | Hours: ${pharmacyHours}</p>
                        </div>
                        ${pharmacyId ? // Only show button if pharmacy data exists
                        `<div class="text-right mt-2">
                            <button class="buy-now-btn bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" 
                                    data-med-id="${med._id}" 
                                    data-pharmacy-id="${pharmacyId}">
                                Buy Now
                            </button>
                        </div>` : ''}
                    `;
                    searchResultsDiv.appendChild(resDiv);
                });
            }
            searchResultsDiv.addEventListener('click', async (e) => {
                const btn = e.target.closest('button.buy-now-btn');
                if (btn) {
                    if (!confirm('This will send a request to the pharmacy. They will contact you to confirm the order. Proceed?')) {
                        return;
                    }
                    const medId = btn.dataset.medId;
                    const pharmacyId = btn.dataset.pharmacyId;
                    if (!medId || !pharmacyId) {
                        return alert('Error: Missing medicine or pharmacy ID.');
                    }
                    try {
                        const response = await fetch('http://localhost:3000/api/orders', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token
                            },
                            body: JSON.stringify({
                                medicineId: medId,
                                pharmacyId: pharmacyId
                            })
                        });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.msg || 'Failed to place order');
                        alert(result.msg);
                    } catch (err) {
                        console.error("Error placing order:", err);
                        alert(`Error: ${err.message}`);
                    }
                }
            });

            // --- D: "Donate Medicine" Page Logic ---
            let selectedMedsForDonation = [];
            async function fetchEligibleMedicines() {
                 if(!medChecklist || !btnToStep2) return;
                if(donateStep1) donateStep1.classList.remove('hidden');
                const donateStep2 = document.getElementById('donate-step-2'); // Re-get element ref
                if(donateStep2) donateStep2.classList.add('hidden');
                medChecklist.innerHTML = '<p>Loading your eligible medicines...</p>';
                const medicines = await fetchMyMedicines(); // Reuse fetch function
                const today = new Date();
                const eligibleMeds = medicines.filter(med => new Date(med.expiryDate) > today);
                medChecklist.innerHTML = '';
                if (eligibleMeds.length === 0) {
                    medChecklist.innerHTML = '<p>You have no unexpired medicines eligible for donation.</p>';
                    btnToStep2.disabled = true;
                    return;
                }
                eligibleMeds.forEach(med => {
                    medChecklist.innerHTML += `
                        <label class="block p-2 rounded hover:bg-gray-100">
                            <input type="checkbox" class="donation-check mr-2" value="${med._id}">
                            ${med.medicineName} (Expires: ${new Date(med.expiryDate).toLocaleDateString()})
                        </label>
                    `;
                });
                 btnToStep2.disabled = true; // Reset button state
            }
            medChecklist.addEventListener('change', () => {
                selectedMedsForDonation = Array.from(document.querySelectorAll('.donation-check:checked')).map(cb => cb.value);
                btnToStep2.disabled = selectedMedsForDonation.length === 0;
            });
            btnToStep2.addEventListener('click', async () => {
                const donateStep2 = document.getElementById('donate-step-2'); // Re-get element ref
                if(donateStep1) donateStep1.classList.add('hidden');
                if(donateStep2) donateStep2.classList.remove('hidden');
                const centerList = document.getElementById('donation-center-list'); // Re-get element ref
                if(centerList) centerList.innerHTML = '<p>Loading nearby centers...</p>'; else return;

                try {
                    const response = await fetch('http://localhost:3000/api/donations/centers', {
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Could not fetch donation centers');
                    const centers = await response.json();
                    centerList.innerHTML = '';
                    if (centers.length === 0) {
                        centerList.innerHTML = '<p>No verified donation centers found.</p>';
                        return;
                    }
                    centers.forEach(center => {
                        centerList.innerHTML += `
                            <div class="p-4 bg-gray-100 rounded-lg">
                                <h4 class="font-bold text-lg">${center.organizationName || 'N/A'}</h4>
                                <p>${center.address || ''}, ${center.city || ''}</p>
                                <p>Accepts: ${(center.acceptingMedicine || []).join(', ')}</p>
                                <button class="submit-donation-btn bg-green-600 text-white px-4 py-1 rounded mt-2 hover:bg-green-700" data-id="${center._id}">
                                    Schedule Drop-Off
                                </button>
                            </div>
                        `;
                    });
                } catch (err) {
                    console.error("Error fetching centers:", err);
                    if(centerList) centerList.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
                }
            });
            const centerList = document.getElementById('donation-center-list'); // Get ref outside listener if possible
            if(centerList) {
                 centerList.addEventListener('click', async (e) => {
                    const btn = e.target.closest('button.submit-donation-btn');
                    if (btn) {
                        const centerId = btn.dataset.id;
                        if (!centerId) return;
                        if (!confirm('Are you sure you want to schedule this donation?')) return;
                        try {
                            const response = await fetch('http://localhost:3000/api/donations', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-auth-token': token
                                },
                                body: JSON.stringify({
                                    donationCenterId: centerId,
                                    medicineIds: selectedMedsForDonation
                                })
                            });
                            const result = await response.json();
                            if (!response.ok) throw new Error(result.msg || 'Failed to schedule donation');
                            alert('Donation request submitted! The center will be in touch.');
                            selectedMedsForDonation = [];
                            showPage('page-my-medicines'); // Go back to My Medicines page
                        } catch (err) {
                            console.error("Error submitting donation:", err);
                            alert(`Error: ${err.message}`);
                        }
                    }
                });
            }

            // --- E: Initial Load for User ---

// --- F: Chatbot Logic --- (Ensure this is INSIDE the userRole === 'user' block)
            const chatbox = document.getElementById('chatbox');
            const chatInput = document.getElementById('chat-input');
            const chatSendBtn = document.getElementById('chat-send-btn'); // Define variable FIRST

            // Check if chatbot elements exist before proceeding
            if (chatbox && chatInput && chatSendBtn) {

                // Function to add a message to the chatbox
                function addChatMessage(message, sender = 'bot') {
                    const messageDiv = document.createElement('div');
                    messageDiv.textContent = message;
                    if (sender === 'user') {
                        messageDiv.className = 'text-right text-blue-700 p-1'; // User style
                    } else {
                        messageDiv.className = 'text-left text-purple-700 p-1'; // Bot style
                    }
                    const placeholder = chatbox.querySelector('.italic');
                    if(placeholder) placeholder.remove();
                    chatbox.appendChild(messageDiv);
                    chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll
                }

                // Function to handle sending a message
                async function sendChatMessage() {
                    const question = chatInput.value.trim();
                    if (!question || !token) return;

                    addChatMessage(question, 'user');
                    chatInput.value = '';
                    chatSendBtn.disabled = true;
                    addChatMessage('Thinking...', 'bot');

                    try {
                        const response = await fetch('http://localhost:3000/api/chatbot/ask', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                            body: JSON.stringify({ question })
                        });

                        // Remove "Thinking..." message BEFORE checking response.ok
                        const thinkingMsg = Array.from(chatbox.children).pop();
                        if (thinkingMsg && thinkingMsg.textContent === 'Thinking...') {
                           thinkingMsg.remove();
                        }

                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.msg || `Request failed (${response.status})`);
                        }

                        const result = await response.json();
                        addChatMessage(result.answer, 'bot');

                    } catch (err) {
                         console.error("Chatbot fetch error:", err);
                         // Ensure thinking message is removed even on error
                         const thinkingMsgOnError = Array.from(chatbox.children).pop();
                         if (thinkingMsgOnError && thinkingMsgOnError.textContent === 'Thinking...') {
                              thinkingMsgOnError.remove();
                         }
                        addChatMessage(`Error: ${err.message}`, 'bot');
                    } finally {
                         chatSendBtn.disabled = false; // Re-enable button
                    }
                }

                // Event listeners for chat - MUST come AFTER defining chatSendBtn and chatInput
                chatSendBtn.addEventListener('click', () => {
                    console.log("Chat Send button clicked!"); // Keep debug log
                    sendChatMessage();
                });

                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        console.log("Chat Enter key pressed!"); // Keep debug log
                        sendChatMessage();
                    }
                });

            } else {
                 console.error("CRITICAL ERROR: Could not find one or more chatbot HTML elements (chatbox, chat-input, chat-send-btn)! Check IDs in user_dashboard.html");
            }
            // --- END Chatbot Logic ---

            showPage('page-my-medicines'); // Start user on "My Medicines" page
         } // End check for essential user elements
    } // End of user-only logic


// --- Part 5: NGO Dashboard Logic ---
    const pendingDonationsListDiv = document.getElementById('pending-donations-list');
    if (userRole === 'ngo' && pendingDonationsListDiv) {
        console.log("Running NGO logic..."); // Debug Log 7

        // --- A: Fetch Pending Donations ---
        async function fetchPendingDonations() {
            pendingDonationsListDiv.innerHTML = '<p>Loading pending donations...</p>';
            try {
                const response = await fetch('http://localhost:3000/api/donations/ngo', {
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.msg || 'Failed to fetch donations');
                }
                const donations = await response.json();
                displayDonations(donations);
            } catch (err) {
                console.error("Error fetching NGO donations:", err);
                pendingDonationsListDiv.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
            }
        }

        // --- B: Display Donations ---
        function displayDonations(donations) {
            pendingDonationsListDiv.innerHTML = '';
            const pendingDonations = donations.filter(d => d.status === 'Pending'); // Only show Pending

            if (pendingDonations.length === 0) {
                pendingDonationsListDiv.innerHTML = '<p>No pending donation requests.</p>';
                return;
            }

            pendingDonations.forEach(donation => {
                const donationCard = document.createElement('div');
                donationCard.className = 'p-4 bg-white shadow rounded-lg';

                // Safely access user details
                const userName = donation.user ? donation.user.name : 'N/A';
                const userEmail = donation.user ? donation.user.email : 'N/A';
                const userPhone = donation.user ? donation.user.phoneNumber || 'Not Provided' : 'N/A';
                const userAddress = donation.user ? donation.user.address || 'Not Provided' : 'N/A';

                // Format medicine details
                const medicineListHtml = donation.medicines && donation.medicines.length > 0
                    ? donation.medicines.map(med => `<li>${med.medicineName || 'N/A'} (Qty: ${med.quantity || 'N/A'}, Expires: ${formatDate(med.expiryDate)})</li>`).join('')
                    : '<li>No medicine details available</li>';

                donationCard.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold">Donation ID: ${donation._id.slice(-6)}</h3>
                            <p class="text-sm text-gray-600">From: ${userName} (${userEmail})</p>
                            <p class="text-sm text-gray-600">Contact: ${userPhone}</p>
                            <p class="text-sm text-gray-600">Address: ${userAddress}</p>
                            <p class="text-sm text-gray-500">Received: ${new Date(donation.createdAt).toLocaleString()}</p>
                            <p class="font-semibold mt-2">Medicines:</p>
                            <ul class="list-disc list-inside text-sm text-gray-700">
                                ${medicineListHtml}
                            </ul>
                        </div>
                        <div class="flex flex-col space-y-2">
                             <button class="update-donation-status-btn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm" data-id="${donation._id}" data-status="Accepted">
                                Accept Donation
                            </button>
                             <button class="update-donation-status-btn bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm" data-id="${donation._id}" data-status="Rejected">
                                Reject Donation
                            </button>
                            </div>
                    </div>
                `;
                pendingDonationsListDiv.appendChild(donationCard);
            });
        }

        // --- C: Handle Status Update Buttons ---
        pendingDonationsListDiv.addEventListener('click', async (e) => {
            const btn = e.target.closest('button.update-donation-status-btn');
            if (!btn) return;

            const donationId = btn.dataset.id;
            const newStatus = btn.dataset.status;
            if (!donationId || !newStatus) return;

            const actionVerb = newStatus.toLowerCase(); // 'accepted' or 'rejected'
            if (!confirm(`Are you sure you want to mark this donation as ${actionVerb}?`)) return;

            try {
                const response = await fetch(`http://localhost:3000/api/donations/${donationId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.msg || `Failed to mark as ${actionVerb}`);

                alert(`Donation successfully marked as ${actionVerb}!`);
                fetchPendingDonations(); // Refresh the list

            } catch (err) {
                 console.error(`Error updating donation status to ${newStatus}:`, err);
                 alert(`Error: ${err.message}`);
            }
        });

        // --- D: Initial Load ---
        fetchPendingDonations(); // Fetch data when NGO page loads

    } // End of NGO-only logic










}); // End of DOMContentLoaded