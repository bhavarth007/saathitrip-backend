document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & State ---
    const logoLink = document.getElementById('logo-link');
    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');
    const navUserGreeting = document.getElementById('nav-user-greeting');
    const navLoginBtn = document.getElementById('nav-login-btn');
    const navRegisterBtn = document.getElementById('nav-register-btn');
    const navLogoutBtn = document.getElementById('nav-logout-btn');

    const heroSection = document.getElementById('hero-section');
    const registerSection = document.getElementById('register-section');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const featuresSection = document.getElementById('features-section');

    function hideAllSections() {
        heroSection.classList.add('hidden');
        registerSection.classList.add('hidden');
        loginSection.classList.add('hidden');
        dashboardSection.classList.add('hidden');
        featuresSection.classList.add('hidden');
    }

    function showHome() {
        hideAllSections();
        heroSection.classList.remove('hidden');
        featuresSection.classList.remove('hidden');
        checkSession();
    }

    // Check if user is logged in
    function checkSession() {
        const userEmail = localStorage.getItem('saathitrip_user');
        if (userEmail) {
            guestNav.classList.add('hidden');
            userNav.classList.remove('hidden');
            navUserGreeting.innerText = `Welcome, ${userEmail.split('@')[0]}`;
        } else {
            guestNav.classList.remove('hidden');
            userNav.classList.add('hidden');
        }
    }

    // Initialization
    showHome();

    logoLink.addEventListener('click', showHome);

    navLoginBtn.addEventListener('click', () => {
        hideAllSections();
        loginSection.classList.remove('hidden');
    });

    navRegisterBtn.addEventListener('click', () => {
        hideAllSections();
        registerSection.classList.remove('hidden');
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        loginSection.classList.remove('hidden');
    });

    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        registerSection.classList.remove('hidden');
    });

    navLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('saathitrip_user');
        showHome();
    });

    // --- Search & Dashboard ---
    const findCompanionBtn = document.getElementById('find-companion-btn');
    const destinationInput = document.getElementById('destination-input');
    const datesInput = document.getElementById('dates-input');
    const matchesGrid = document.getElementById('matches-grid');
    const dashboardSubtitle = document.getElementById('dashboard-subtitle');

    findCompanionBtn.addEventListener('click', async () => {
        const dest = destinationInput.value.trim();
        if (!dest) {
            alert('Please enter a destination first!');
            return;
        }

        const userEmail = localStorage.getItem('saathitrip_user');
        if (!userEmail) {
            alert('Please login or register to view matches!');
            hideAllSections();
            loginSection.classList.remove('hidden');
            return;
        }

        // Fetch matches from backend
        try {
            findCompanionBtn.innerText = 'Searching...';
            const response = await fetch('/api/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination: dest, dates: datesInput.value })
            });
            const data = await response.json();
            
            if (data.success) {
                renderMatches(data.matches, dest);
                hideAllSections();
                dashboardSection.classList.remove('hidden');
            } else {
                alert('Error finding matches.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to connect to backend.');
        } finally {
            findCompanionBtn.innerText = 'Find Companions';
        }
    });

    function renderMatches(matches, destination) {
        dashboardSubtitle.innerText = `Showing verified travelers heading to ${destination}`;
        matchesGrid.innerHTML = '';
        
        if (matches.length === 0) {
            matchesGrid.innerHTML = '<p>No matches found yet for this destination. Try again later!</p>';
            return;
        }

        matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'glass-card match-card';
            card.innerHTML = `
                <div class="user-profile">
                    <div class="avatar bg-gradient" style="background: ${match.color};"></div>
                    <div class="user-info">
                        <h4>${match.name}</h4>
                        <span class="verified-tag">✓ Verified</span>
                    </div>
                </div>
                <p class="match-details">Going to ${match.destination}</p>
                <div class="tags">
                    ${match.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <button class="btn btn-primary mt-2 w-100" onclick="alert('Connection request sent to ${match.name}! Wait for them to accept.')">Send Request</button>
            `;
            matchesGrid.appendChild(card);
        });
    }

    // --- Registration Flow ---
    const regEmailInput = document.getElementById('reg-email-input');
    const regMobileInput = document.getElementById('reg-mobile-input');
    const regSendOtpBtn = document.getElementById('reg-send-otp-btn');
    const regOtpContainer = document.getElementById('reg-otp-container');
    const regEmailOtpInput = document.getElementById('reg-email-otp-input');
    const regMobileOtpInput = document.getElementById('reg-mobile-otp-input');
    const regVerifyBtn = document.getElementById('reg-verify-btn');

    regSendOtpBtn.addEventListener('click', async () => {
        const email = regEmailInput.value.trim();
        const mobile = regMobileInput.value.trim();
        
        if (!email || !mobile) {
            alert('Please enter both Email and Mobile.');
            return;
        }

        regSendOtpBtn.innerText = 'Sending...';
        try {
            const response = await fetch('/api/register/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, mobile: mobile })
            });
            const data = await response.json();
            
            if (data.success) {
                let alertMsg = '';
                if (data.real_email_sent) alertMsg += `✅ Real Email OTP sent to ${email}\n`;
                alertMsg += `[MOCK UI] SMS OTP sent to ${mobile}: ${data.mock_mobile_otp}`;
                alert(alertMsg);
                
                document.getElementById('register-container').classList.add('hidden');
                regOtpContainer.classList.remove('hidden');
            } else {
                alert(data.error || 'Failed to send OTPs.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
        regSendOtpBtn.innerText = 'Send OTPs';
    });

    regVerifyBtn.addEventListener('click', async () => {
        regVerifyBtn.innerText = 'Verifying...';
        try {
            const response = await fetch('/api/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: regEmailInput.value.trim(), 
                    mobile: regMobileInput.value.trim(),
                    email_otp: regEmailOtpInput.value.trim(),
                    mobile_otp: regMobileOtpInput.value.trim()
                })
            });
            const data = await response.json();
            
            if (data.success) {
                alert('Registration successful! Please login to continue.');
                hideAllSections();
                loginSection.classList.remove('hidden');
                
                // reset reg form
                document.getElementById('register-container').classList.remove('hidden');
                regOtpContainer.classList.add('hidden');
                regEmailInput.value = ''; regMobileInput.value = '';
                regEmailOtpInput.value = ''; regMobileOtpInput.value = '';
            } else {
                alert(data.error || 'Invalid OTPs.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
        regVerifyBtn.innerText = 'Complete Registration';
    });

    // --- Login Flow ---
    const loginIdentifierInput = document.getElementById('login-identifier-input');
    const loginSendOtpBtn = document.getElementById('login-send-otp-btn');
    const loginOtpContainer = document.getElementById('login-otp-container');
    const loginOtpInput = document.getElementById('login-otp-input');
    const loginVerifyBtn = document.getElementById('login-verify-btn');

    loginSendOtpBtn.addEventListener('click', async () => {
        const identifier = loginIdentifierInput.value.trim();
        if (!identifier) {
            alert('Please enter your registered Email or Mobile number.');
            return;
        }

        loginSendOtpBtn.innerText = 'Sending...';
        try {
            const response = await fetch('/api/login/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: identifier })
            });
            const data = await response.json();
            
            if (data.success) {
                let alertMsg = '';
                if (data.real_email_sent) alertMsg += `✅ Real Email OTP sent to ${identifier}\n`;
                if (data.mock_otp) alertMsg += `[MOCK UI] OTP sent: ${data.mock_otp}`;
                alert(alertMsg);
                
                document.getElementById('login-container').classList.add('hidden');
                loginOtpContainer.classList.remove('hidden');
            } else {
                alert(data.error || 'Failed to send OTP. Are you registered?');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
        loginSendOtpBtn.innerText = 'Send Login OTP';
    });

    loginVerifyBtn.addEventListener('click', async () => {
        loginVerifyBtn.innerText = 'Verifying...';
        try {
            const response = await fetch('/api/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    identifier: loginIdentifierInput.value.trim(), 
                    otp: loginOtpInput.value.trim()
                })
            });
            const data = await response.json();
            
            if (data.success) {
                // Set session
                localStorage.setItem('saathitrip_user', data.user.email);
                showHome();
                
                // reset login form
                document.getElementById('login-container').classList.remove('hidden');
                loginOtpContainer.classList.add('hidden');
                loginIdentifierInput.value = '';
                loginOtpInput.value = '';
            } else {
                alert(data.error || 'Invalid OTP.');
            }
        } catch (e) {
            alert('Failed to connect to backend.');
        }
        loginVerifyBtn.innerText = 'Log In';
    });
});
