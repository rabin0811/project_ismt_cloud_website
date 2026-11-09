function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.remove('active');
    });
});

async function submitForm(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
        full_name: form.querySelector('[name="full_name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        campus: form.querySelector('[name="campus"]').value,
        course_id: Number(form.querySelector('[name="course_id"]').value),
        message: form.querySelector('[name="message"]').value.trim()
    };

    try {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || 'Application could not be submitted.');
        }
        alert('Thank you! Your application has been received. The ISMT admissions team will contact you soon.');
        form.reset();
    } catch (error) {
        alert('Sorry, the application could not be submitted. ' + error.message);
    }
}

// Reveal animation on scroll
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.about-card, .course-card, .campus-card, .phase, .reason').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});
