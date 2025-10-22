// app.js — Handles modal behavior (login, signup, cart) with exclusivity and accessibility niceties.

(function(){
  const overlay = document.querySelector('[data-overlay]');
  const modals = {
    login: document.querySelector('[data-modal="login"]'),
    signup: document.querySelector('[data-modal="signup"]'),
    cart: document.querySelector('[data-modal="cart"]'),
  };

  function closeAll(){
    Object.values(modals).forEach(m => {
      if(!m) return;
      m.setAttribute('aria-hidden','true');
    });
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  function openModal(name){
    closeAll();
    const el = modals[name];
    if(!el) return;
    el.setAttribute('aria-hidden','false');
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    // Focus first input/button for keyboard users
    const focusable = el.querySelector('input, button, [href], textarea, select');
    if (focusable) focusable.focus();
  }

  // Open triggers
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn){
      e.preventDefault();
      const name = btn.getAttribute('data-open');
      openModal(name);
    }
    if (e.target.matches('[data-close]') || e.target.closest('[data-close]')){
      e.preventDefault();
      closeAll();
    }
  });

  // Close on overlay click
  if (overlay){
    overlay.addEventListener('click', closeAll);
  }

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Trap focus inside open modal/sidebar
  document.addEventListener('keydown', (e) => {
    const open = Object.values(modals).find(m => m.getAttribute('aria-hidden') === 'false');
    if (!open) return;
    if (e.key !== 'Tab') return;
    const focusables = open.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first){
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last){
      first.focus(); e.preventDefault();
    }
  });
})();