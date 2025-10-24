// File: frontend/js/protect.js

// This function runs immediately
(function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // No token found, redirect to login page
        alert('You are not logged in. Redirecting to login page.');
        
        // This assumes your login page is index.html in the same folder level
        // Adjust the path if it's different (e.g., '../index.html')
        window.location.href = 'index.html'; 
    }

    // If token exists, we can stay on the page.
    // We could add more checks here later, like verifying the role.
})();