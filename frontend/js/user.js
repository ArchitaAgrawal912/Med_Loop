// Define the backend API URL
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    // Check for auth token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html'; // Redirect to login if no token
        return;
    }
    const headers = { 'Content-Type': 'application/json', 'x-auth-token': token };

    // Get elements
    const medicineList = document.getElementById('medicine-list');
    const addMedicineForm = document.getElementById('add-medicine-form');
    const searchForm = document.getElementById('search-pharmacy-form');
    const searchResults = document.getElementById('search-results');
    const findNgosBtn = document.getElementById('find-ngos-btn');
    const ngoList = document.getElementById('ngo-list');

    // --- 1. Fetch and Display User's Medicines ---
    const fetchMedicines = async () => {
        try {
            const res = await fetch(`${API_URL}/api/medicines`, { headers });
            if (!res.ok) throw new Error('Failed to fetch medicines');
            
            const medicines = await res.json();
            medicineList.innerHTML = ''; // Clear list
            
            medicines.forEach(med => {
                const expiry = new Date(med.expiryDate);
                const isExpired = expiry < new Date();
                const cardColor = isExpired ? 'border-red-500 bg-red-50' : 'border-gray-200';

                const medEl = document.createElement('div');
                medEl.className = `p-4 border rounded-lg shadow-sm ${cardColor}`;
                medEl.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg">${med.name}</h3>
                            <p class="text-sm ${isExpired ? 'text-red-700 font-bold' : 'text-gray-600'}">
                                Expires: ${expiry.toLocaleDateString()}
                            </p>
                            <p class="text-sm font-semibold capitalize">Status: ${med.status}</p>
                        </div>
                        ${med.status === 'personal' && !isExpired ? 
                        `<button data-id="${med._id}" class="donate-btn bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600">Mark as Donatable</button>` : 
                        (med.status === 'donatable' ? `<span class="text-purple-700 font-semibold">Ready to Donate</span>` : '')}
                    </div>
                `;
                medicineList.appendChild(medEl);
            });
        } catch (err) {
            console.error(err);
            medicineList.innerHTML = '<p class="text-red-500">Could not load medicines.</p>';
        }
    };

    // --- 2. Add New Medicine ---
    addMedicineForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('med-name').value;
        const expiryDate = document.getElementById('med-expiry').value;
        
        await fetch(`${API_URL}/api/medicines`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, expiryDate }),
        });
        addMedicineForm.reset();
        fetchMedicines(); // Refresh list
    });

    // --- 3. Mark Medicine as Donatable ---
    medicineList.addEventListener('click', async e => {
        if (e.target.classList.contains('donate-btn')) {
            const id = e.target.dataset.id;
            await fetch(`${API_URL}/api/medicines/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'donatable' }),
            });
            fetchMedicines(); // Refresh list
        }
    });
    
    // --- 4. Search for Medicine in Pharmacies ---
    searchForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('search-med-name').value;
        const res = await fetch(`${API_URL}/api/medicines/search?name=${name}`);
        const pharmacies = await res.json();
        
        searchResults.innerHTML = '<h4 class="font-semibold mb-2">Available At:</h4>';
        if (pharmacies.length === 0) {
            searchResults.innerHTML += '<p class="text-sm text-gray-600">No verified pharmacies found with this medicine.</p>';
        } else {
            pharmacies.forEach(p => {
                 searchResults.innerHTML += `
                    <div class="p-2 border-b last:border-b-0">
                        <strong class="text-blue-700">${p.name}</strong>
                        <p class="text-sm text-gray-600">${p.address}</p>
                    </div>`;
            });
        }
    });

    // --- 5. Find Verified NGOs ---
    findNgosBtn.addEventListener('click', async () => {
        const res = await fetch(`${API_URL}/api/medicines/donations/ngos`);
        const ngos = await res.json();
        
        ngoList.innerHTML = '<h4 class="font-semibold mb-2">Verified Donation Centers:</h4>';
        if (ngos.length === 0) {
             ngoList.innerHTML += '<p class="text-sm text-gray-600">No NGOs found. Please check back later.</p>';
        } else {
            ngos.forEach(n => {
                ngoList.innerHTML += `
                    <div class="p-2 border-b last:border-b-0">
                        <strong class="text-purple-700">${n.name}</strong>
                        <p class="text-sm text-gray-600">${n.address}</p>
                    </div>`;
            });
        }
    });

    // --- 6. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });

    // Initial Load
    fetchMedicines();
});

