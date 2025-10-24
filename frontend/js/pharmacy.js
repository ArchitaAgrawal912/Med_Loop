// Define the backend API URL
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // Check for auth token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    const headers = { 'Content-Type': 'application/json', 'x-auth-token': token };

    // Get elements
    const statusDiv = document.getElementById('verification-status');
    const inventoryList = document.getElementById('inventory-list');
    const stockForm = document.getElementById('stock-update-form');

    // --- 1. Fetch Pharmacy Data and Inventory ---
    const fetchPharmacyData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/organizations/pharmacy/me`, { headers });
            if (!res.ok) throw new Error('Failed to fetch data');

            const pharmacy = await res.json();

            // Update verification status
            if (pharmacy.isVerified) {
                statusDiv.textContent = 'Your profile is VERIFIED and visible to users.';
                statusDiv.className = 'mb-6 p-4 rounded-lg text-center font-semibold bg-green-100 text-green-800';
            } else {
                statusDiv.textContent = 'Your profile is PENDING VERIFICATION by an admin.';
                statusDiv.className = 'mb-6 p-4 rounded-lg text-center font-semibold bg-yellow-100 text-yellow-800';
            }
            
            // Populate inventory list
            inventoryList.innerHTML = '';
            if (pharmacy.inventory.length === 0) {
                inventoryList.innerHTML = '<p class="text-gray-500">Your inventory is empty. Add medicines using the form above.</p>';
            } else {
                pharmacy.inventory.forEach(item => {
                    let stockColor = 'text-gray-700';
                    if(item.stock === 'In Stock') stockColor = 'text-green-700';
                    if(item.stock === 'Low Stock') stockColor = 'text-yellow-700';
                    if(item.stock === 'Out of Stock') stockColor = 'text-red-700';

                    inventoryList.innerHTML += `
                        <div class="p-3 border-b flex justify-between items-center">
                            <span class="font-medium">${item.medicineName}</span>
                            <span class="font-bold ${stockColor}">${item.stock}</span>
                        </div>`;
                });
            }
        } catch (err) {
            console.error(err);
            statusDiv.innerHTML = '<p class="text-red-500">Could not load your data.</p>';
        }
    };

    // --- 2. Handle Stock Update ---
    stockForm.addEventListener('submit', async e => {
        e.preventDefault();
        const medicineName = document.getElementById('stock-med-name').value;
        const stock = document.getElementById('stock-status').value;

        if (!medicineName) {
            alert('Please enter a medicine name.');
            return;
        }

        await fetch(`${API_URL}/api/organizations/pharmacy/stock`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ medicineName, stock })
        });
        
        stockForm.reset();
        fetchPharmacyData(); // Refresh list
    });

    // --- 3. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });
    
    // Initial Load
    fetchPharmacyData();
});