document.addEventListener('DOMContentLoaded', () => {

    // ======== 1. Mobile Navbar Toggle ========
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ======== 2. Active Nav Link on Scroll ========
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.getElementById('header').offsetHeight;

    function onScroll() {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - headerHeight - 50; // Add 50px offset
            
            const sectionId = current.getAttribute('id');
            const correspondingNavLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                // Remove active from all
                navLinks.forEach(link => link.classList.remove('active'));
                // Add active to the current one
                if (correspondingNavLink) {
                    correspondingNavLink.classList.add('active');
                }
            }
        });

        // Special case for home (top of page)
        if (scrollY < sections[0].offsetTop - headerHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    }
    window.addEventListener('scroll', onScroll);
    onScroll(); // Run once on load

    // ======== 3. Contact Form Submission (Fetch API) ========
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        formStatus.textContent = '';
        formStatus.classList.remove('success', 'error');

        const formData = new FormData(contactForm);

        try {
            const response = await fetch('/submit_message', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                formStatus.textContent = result.message;
                formStatus.classList.add('success');
                contactForm.reset(); // Clear the form
            } else {
                formStatus.textContent = result.message;
                formStatus.classList.add('error');
            }

        } catch (error) {
            console.error('Error:', error);
            formStatus.textContent = 'An unexpected error occurred. Please try again.';
            formStatus.classList.add('error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });

    // ======== 4. Simple Typing Effect ========
    const typeEffectSpan = document.querySelector('.type-effect');
    const words = ["AI Innovator", "Data Scientist", "Full Stack Developer"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentWord = words[wordIndex];
        let text = '';

        if (isDeleting) {
            // Deleting
            text = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            // Typing
            text = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        typeEffectSpan.textContent = text;

        let typeSpeed = 150;
        if (isDeleting) {
            typeSpeed /= 2; // Faster deleting
        }

        if (!isDeleting && charIndex === currentWord.length) {
            // Pause at end of word
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
});