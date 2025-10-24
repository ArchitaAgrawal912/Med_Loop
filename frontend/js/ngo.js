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

    // --- 1. Fetch NGO Data ---
    const fetchNgoData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/organizations/ngo/me`, { headers });
            if (!res.ok) throw new Error('Failed to fetch data');

            const ngo = await res.json();
            
            // Update verification status
            if (ngo.isVerified) {
                statusDiv.textContent = 'Your profile is VERIFIED. Users can now see you as a donation center.';
                statusDiv.className = 'mb-6 p-4 rounded-lg text-center font-semibold bg-green-100 text-green-800';
            } else {
                statusDiv.textContent = 'Your profile is PENDING VERIFICATION by an admin.';
                statusDiv.className = 'mb-6 p-4 rounded-lg text-center font-semibold bg-yellow-100 text-yellow-800';
            }
        } catch (err) {
            console.error(err);
            statusDiv.innerHTML = '<p class="text-red-500">Could not load your data.</p>';
        }
    };

    // --- 2. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/index.html';
    });
    
    // Initial Load
    fetchNgoData();
});