// ─── NAVBAR SCROLL ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ─── HAMBURGER MENU ───
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  const btn = document.querySelector('.btn-nav');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '72px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = '#fff';
  links.style.padding = '1rem 2rem 1.5rem';
  links.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
  links.style.zIndex = '999';
});

// ─── SCROLL REVEAL ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.service-card, .testimonial-card, .contact-card, .gallery-item, .why-list li')
  .forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${i * 60}ms`;
    revealObserver.observe(el);
  });

// ─── APPOINTMENT FORM ───
const apptForm = document.getElementById('apptForm');
apptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('✅ Appointment request sent! We\'ll confirm within 2 hours.');
  apptForm.reset();
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.querySelector('span').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─── CHAT WIDGET ───
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

let chatOpen = false;

function toggleChat() {
  chatOpen = !chatOpen;
  chatWindow.classList.toggle('open', chatOpen);
  document.querySelector('.chat-icon-open').classList.toggle('hidden', chatOpen);
  document.querySelector('.chat-icon-close').classList.toggle('hidden', !chatOpen);
  if (chatOpen) chatInput.focus();
}

chatToggle.addEventListener('click', toggleChat);
chatCloseBtn.addEventListener('click', toggleChat);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendSuggestion(text) {
  chatInput.value = text;
  sendMessage();
}

function appendMessage(text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<span>${text}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function showTyping() {
  const div = appendMessage('⏳ Thinking...', 'bot typing');
  return div;
}

// Dental knowledge base for the smart assistant
const dentalKB = {
  services: `We offer a comprehensive range of dental services at Dr. Bansode's Bright & Shine Dental Square:
🦷 **Dental Implants** – Permanent tooth replacement
✨ **Teeth Whitening** – Up to 8 shades brighter
😁 **Smile Makeover** – Complete smile transformation
🔬 **Root Canal Treatment** – Pain-free, save your tooth
📐 **Orthodontics / Braces** – Metal, ceramic & clear aligners
👶 **Pediatric Dentistry** – Child-friendly gentle care
👑 **Crowns & Bridges** – Restore damaged teeth
🏥 **Preventive Care** – Cleaning, scaling & polishing`,

  hours: `Our clinic hours are:
🕐 **Monday – Wednesday & Friday – Saturday:** 10:30 AM – 2:00 PM & 5:15 PM – 8:30 PM
🔴 **Thursday:** Closed
📅 You can book an appointment any time online!`,

  location: `📍 We are located at **Dental Square, Pune, Maharashtra, India**.
You can find us on Google Maps by searching "Dr. Bansode's Bright and Shine Dental Square Pune". We have ample parking available.`,

  doctor: `👩‍⚕️ **Dr. Pooja Bhure-Bansode, BDS** is our principal dental surgeon.
She has 10+ years of clinical experience and specializes in cosmetic dentistry, implants, and pediatric care.
Registration No. A31210 (MCI Verified)
She is known for her gentle, pain-free approach and dedication to each patient's comfort.`,

  pricing: `We believe in transparent, affordable pricing with no hidden costs.
💰 **Payment options:** Cash, UPI, Card, Net Banking
📋 **EMI available** for major treatments
🏥 **Cashless insurance** accepted from major providers
For exact quotes, please book a **free consultation** — our team will assess your needs and provide a detailed treatment plan. Call us: +91 98765 43210`,

  appointment: `Booking is easy! You can:
📱 **Call / WhatsApp:** +91 98765 43210
🌐 **Online:** Use the booking form on this page (scroll up to "Book Appointment")
⚡ We confirm appointments within **2 hours**!
Free consultation is available — no obligation.`,

  whitening: `Our professional **Teeth Whitening** treatment:
✨ Results in a single session (60–90 min)
⭐ Up to **8 shades brighter**
🔬 Uses clinic-grade whitening gel (not store-bought strips)
😌 Comfortable, sensitivity-managed procedure
💰 Affordable pricing — contact us for a quote!`,

  implants: `Our **Dental Implants** are:
🦷 Premium titanium implants that last a lifetime
✅ Look, feel & function like natural teeth
🔬 Computer-guided placement for precision
⏱️ Typically completed in 2–3 visits
💉 Local anaesthesia — completely pain-free
Book a free consultation to see if you're a candidate!`,

  kids: `We love our little patients! Our **Pediatric Dentistry** services:
👶 Child-friendly, anxiety-free environment
🎨 Decorated treatment room to ease nerves
😊 Dr. Bansode has special training in child psychology
🍬 Sugar-free rewards after every visit!
We recommend a first dental visit by age 1 or when the first tooth appears.`,

  emergency: `For **dental emergencies**, please call us immediately:
📞 **+91 98765 43210**
🚨 Common emergencies we handle: toothache, broken tooth, lost filling/crown, dental abscess
⚡ We try to accommodate emergency cases on the same day.`,
};

function getDentalResponse(userMsg) {
  const msg = userMsg.toLowerCase();

  if (msg.includes('service') || msg.includes('treat') || msg.includes('offer') || msg.includes('what do'))
    return dentalKB.services;
  if (msg.includes('hour') || msg.includes('time') || msg.includes('open') || msg.includes('close') || msg.includes('when'))
    return dentalKB.hours;
  if (msg.includes('location') || msg.includes('address') || msg.includes('where') || msg.includes('find'))
    return dentalKB.location;
  if (msg.includes('doctor') || msg.includes('dr') || msg.includes('bansode') || msg.includes('surgeon') || msg.includes('pooja'))
    return dentalKB.doctor;
  if (msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('charge') || msg.includes('afford') || msg.includes('emi'))
    return dentalKB.pricing;
  if (msg.includes('book') || msg.includes('appoint') || msg.includes('schedule') || msg.includes('visit'))
    return dentalKB.appointment;
  if (msg.includes('whiten') || msg.includes('bright') || msg.includes('white'))
    return dentalKB.whitening;
  if (msg.includes('implant'))
    return dentalKB.implants;
  if (msg.includes('kid') || msg.includes('child') || msg.includes('baby') || msg.includes('pediatric'))
    return dentalKB.kids;
  if (msg.includes('emergency') || msg.includes('urgent') || msg.includes('pain') || msg.includes('ache') || msg.includes('broken'))
    return dentalKB.emergency;
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste'))
    return `Namaste! 👋 Welcome to Dr. Bansode's Bright & Shine Dental Square!\n\nI'm your smart dental assistant. I can help you with:\n• Information about our services\n• Booking an appointment\n• Clinic hours & location\n• Treatment costs & FAQs\n\nWhat would you like to know?`;
  if (msg.includes('thank'))
    return `You're welcome! 😊 It's our pleasure to help. For anything else, feel free to ask or call us at **+91 98765 43210**. We look forward to giving you a beautiful smile! 🦷✨`;
  if (msg.includes('rating') || msg.includes('review') || msg.includes('google'))
    return `We're proud to have a **4.9 ⭐ rating** on Google from 48 verified reviews! 🏆\n\nOur patients love us for our gentle approach, modern equipment, and Dr. Bansode's expertise. You can read all reviews on Google Maps by searching "Dr. Bansode's Bright and Shine Dental Square Pune".`;

  return `Thank you for your message! 😊 For the most accurate answer, I recommend:\n📞 **Call us:** +91 98765 43210\n💬 **WhatsApp:** +91 98765 43210\n📅 Or **book a free consultation** using the form on this page!\n\nOur team is available Mon–Sat (Thu closed) to assist you. Is there anything else I can help with?`;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Remove suggestion buttons if they exist
  const suggestions = chatMessages.querySelector('.chat-suggestions');
  if (suggestions) suggestions.remove();

  appendMessage(text, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  document.getElementById('chatSend').disabled = true;

  const typingEl = showTyping();

  // Simulate assistant response with realistic delay
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

  typingEl.remove();
  const response = getDentalResponse(text);
  appendMessage(response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>'), 'bot');

  chatInput.disabled = false;
  document.getElementById('chatSend').disabled = false;
  chatInput.focus();
}

// ─── SMOOTH ACTIVE NAV ───
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        link.style.background = '';
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.style.color = 'var(--teal)';
          link.style.background = 'var(--teal-xlight)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ─── COUNTER ANIMATION ───
function animateCounters() {
  const stats = document.querySelectorAll('.stat strong');
  stats.forEach(el => {
    const target = el.textContent;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return;
    const suffix = target.replace(/[0-9.]/g, '');
    let current = 0;
    const step = num / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, num);
      el.textContent = (Number.isInteger(num) ? Math.floor(current) : current.toFixed(1)) + suffix;
      if (current >= num) clearInterval(timer);
    }, 16);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    animateCounters();
    heroObserver.disconnect();
  }
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// ─── GALLERY HOVER ───
document.querySelectorAll('.gallery-placeholder').forEach(item => {
  item.addEventListener('click', () => {
    showToast('📸 Full gallery coming soon with Higgsfield AI-generated images!');
  });
});
