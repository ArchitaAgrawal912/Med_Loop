// File: frontend/js/auth.js

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Part 1: Logic for showing/hiding form fields ---
    
    const roleSelect = document.getElementById('register-role');
    
    // Get all the role-specific field containers
    const userFields = document.getElementById('user-fields');
    const ngoFields = document.getElementById('ngo-fields');
    const pharmacyFields = document.getElementById('pharmacy-fields');

    // Also get the common fields that change visibility
    const addressField = document.getElementById('register-address');
    const cityField = document.getElementById('register-city');
    const pincodeField = document.getElementById('register-pincode');
    
    if (roleSelect) {
       function toggleRoleFields() {
            const selectedRole = roleSelect.value;
            console.log("toggleRoleFields called. Selected Role:", selectedRole); // Keep this log

            // Get references inside the function just in case
            const userFieldsDiv = document.getElementById('user-fields');
            const ngoFieldsDiv = document.getElementById('ngo-fields');
            const pharmacyFieldsDiv = document.getElementById('pharmacy-fields');
            const addressInput = document.getElementById('register-address');
            const cityInput = document.getElementById('register-city');
            const pincodeInput = document.getElementById('register-pincode');

            // Hide everything first using direct style manipulation (more forceful)
            if (userFieldsDiv) userFieldsDiv.style.display = 'none';
            if (ngoFieldsDiv) ngoFieldsDiv.style.display = 'none';
            if (pharmacyFieldsDiv) pharmacyFieldsDiv.style.display = 'none';
            if (cityInput) cityInput.style.display = 'none';
            if (pincodeInput) pincodeInput.style.display = 'none';
            // Keep address always visible for simplicity now, unless hidden by role below
            if (addressInput) addressInput.style.display = 'block'; 

            // Show the correct section based on role
            if (selectedRole === 'user') {

                // --- ADD THESE LOGS ---
                console.log("Attempting to show user fields...");
                console.log("User fields element:", userFieldsDiv); // Check if the element was found
                // --- END ADDED LOGS ---


                if (userFieldsDiv) userFieldsDiv.style.display = 'block'; // Show user fields
                // Address is already visible
            } else if (selectedRole === 'ngo') {
                if (ngoFieldsDiv) ngoFieldsDiv.style.display = 'block';
                if (cityInput) cityInput.style.display = 'block';
                if (pincodeInput) pincodeInput.style.display = 'block';
            } else if (selectedRole === 'pharmacy') {
                if (pharmacyFieldsDiv) pharmacyFieldsDiv.style.display = 'block';
                if (cityInput) cityInput.style.display = 'block';
                if (pincodeInput) pincodeInput.style.display = 'block';
            }
        }

        roleSelect.addEventListener('change', toggleRoleFields);
        toggleRoleFields();
    }


    // --- Part 2: Logic for submitting the registration form ---

    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const API_URL = 'http://localhost:3000/api/auth/register';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData, 
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.msg); 
                    registerForm.reset(); 
                    if (roleSelect) {
                        toggleRoleFields(); 
                    }
                } else {
                    alert(`Error: ${result.msg}`); 
                }

            } catch (err) { // <-- THIS IS THE FIX (dot removed)
                console.error('Submit error:', err);
                alert('An error occurred. Please check the console and try again.');
            }
        });
    }


    // --- Part 3: Logic for submitting the LOGIN form ---

    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const API_URL = 'http://localhost:3000/api/auth/login';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    // --- LOGIN SUCCESSFUL ---
                    alert('Login successful!');

                    localStorage.setItem('token', result.token);
                    localStorage.setItem('userRole', result.role);

                    // --- REDIRECT to the correct dashboard ---
                    if (result.role === 'admin') {
                        window.location.href = 'admin_dashboard.html'; 
                    } else if (result.role === 'ngo') {
                        window.location.href = 'ngo_dashboard.html';
                    } else if (result.role === 'pharmacy') {
                        window.location.href = 'pharmacy_dashboard.html'; 
                    } else {
                        window.location.href = 'user_dashboard.html'; 
                    }

                } else {
                    alert(`Login Failed: ${result.msg}`);
                }

            } catch (err) {
                console.error('Login error:', err);
                alert('An error occurred. Please try again.');
            }
        });
    }




    // --- Part 4: Password Visibility Toggle ---

// Find all buttons with the 'password-toggle' class
const toggleButtons = document.querySelectorAll('.password-toggle');

toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Get the ID of the target input field from the button's data-target attribute
        const targetInputId = button.getAttribute('data-target');
        const passwordInput = document.getElementById(targetInputId);

        if (passwordInput) {
            // Check the current type of the input
            const currentType = passwordInput.getAttribute('type');

            // Toggle between 'password' and 'text'
            if (currentType === 'password') {
                passwordInput.setAttribute('type', 'text');
                button.textContent = '🙈'; // Change icon to closed eye (optional)
            } else {
                passwordInput.setAttribute('type', 'password');
                button.textContent = '👁️'; // Change icon back to open eye (optional)
            }
        }
    });
});
});