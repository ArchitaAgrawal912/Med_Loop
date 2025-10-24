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
    const pharmacyList = document.getElementById('pharmacy-verification-list');
    const ngoList = document.getElementById('ngo-verification-list');

    // --- 1. Fetch Organizations Awaiting Verification ---
    const fetchVerificationData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/verify`, { headers });
            if (!res.ok) throw new Error('Failed to fetch data');
            
            const data = await res.json();
            
            // Populate Pharmacies List
            pharmacyList.innerHTML = '';
            if (data.pharmacies.length === 0) {
                pharmacyList.innerHTML = '<p class="text-gray-500">No pharmacies awaiting verification.</p>';
            } else {
                data.pharmacies.forEach(p => {
                    pharmacyList.innerHTML += `
                        <div class="p-3 border rounded-lg bg-white shadow-sm">
                            <p><strong>Name:</strong> ${p.name}</p>
                            <p><strong>Email:</strong> ${p.ownerAccount.email}</p>
                            <p><strong>License:</strong> ${p.drugLicense}</p>
                            <button data-id="${p._id}" data-type="pharmacy" class="verify-btn mt-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600">Verify</button>
                        </div>
                    `;
                });
            }
            
            // Populate NGOs List
            ngoList.innerHTML = '';
            if (data.ngos.length === 0) {
                ngoList.innerHTML = '<p class="text-gray-500">No NGOs awaiting verification.</p>';
            } else {
                data.ngos.forEach(n => {
                    ngoList.innerHTML += `
                        <div class="p-3 border rounded-lg bg-white shadow-sm">
                            <p><strong>Name:</strong> ${n.name}</p>
                            <p><strong>Email:</strong> ${n.ownerAccount.email}</p>
                            <p><strong>Reg. ID:</strong> ${n.registrationId}</p>
                            <button data-id="${n._id}" data-type="ngo" class="verify-btn mt-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600">Verify</button>
                        </div>
                    `;
                });
            }
        } catch (err) {
            console.error(err);
            pharmacyList.innerHTML = '<p class="text-red-500">Error loading data.</p>';
            ngoList.innerHTML = '<p class="text-red-500">Error loading data.</p>';
        }
    };

    // --- 2. Handle Verification Button Click (Event Delegation) ---
    document.body.addEventListener('click', async e => {
        if (e.target.classList.contains('verify-btn')) {
            const { id, type } = e.target.dataset;
            
            if (confirm(`Are you sure you want to verify this ${type}?`)) {
                try {
                    const res = await fetch(`${API_URL}/api/admin/verify/${type}/${id}`, {
                        method: 'PUT',
                        headers
                    });
                    if (!res.ok) throw new Error('Verification failed');
                    
                    fetchVerificationData(); // Refresh both lists
                } catch (err) {
                    console.error(err);
                    alert(`Failed to verify ${type}.`);
                }
            }
        }
    });

    // --- 3. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // Initial Load
    fetchVerificationData();
});