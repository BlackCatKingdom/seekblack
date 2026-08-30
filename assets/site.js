(() => {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .06, rootMargin: '0px 0px -6% 0px' })
    : null;
  document.querySelectorAll('.reveal').forEach((el) => revealObserver ? revealObserver.observe(el) : el.classList.add('in'));
  // Fallback: never leave content hidden if an observer callback is skipped.
  setTimeout(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')), 1800);

  // Selected Work uses a narrow center band to mark the current scroll chapter.
  const storyItems = document.querySelectorAll('.project-story');
  if (storyItems.length && 'IntersectionObserver' in window && !reducedMotion) {
    const storyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('story-active', entry.isIntersecting));
    }, { rootMargin: '-28% 0px -28% 0px', threshold: 0 });
    storyItems.forEach((item) => storyObserver.observe(item));
  } else {
    storyItems.forEach((item) => item.classList.add('story-active'));
  }

  const menu = document.querySelector('.mobile-menu');
  const openBtn = document.querySelector('.menu-btn');
  const closeBtn = document.querySelector('.mobile-close');
  const setMenu = (open) => {
    if (!menu) return;
    menu.inert = !open;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) closeBtn?.focus();
    else if (document.activeElement === closeBtn) openBtn?.focus();
  };
  openBtn?.addEventListener('click', () => setMenu(true));
  closeBtn?.addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  const modal = document.querySelector('[data-contact-modal]');
  const modalClose = modal?.querySelector('.contact-modal-close');
  let modalOpener = null;
  const setModal = (open) => {
    if (!modal) return;
    const wasOpen = modal.classList.contains('open');
    if (open) modalOpener = document.activeElement;
    modal.inert = !open;
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (open) setTimeout(() => modalClose?.focus({ preventScroll: true }), 0);
    else if (wasOpen) {
      modalOpener?.focus?.();
      modalOpener = null;
    }
  };
  document.querySelector('[data-contact="wechat"]')?.addEventListener('click', () => setModal(true));
  document.querySelectorAll('[data-contact-close]').forEach((button) => button.addEventListener('click', () => setModal(false)));
  const legacyCopy = (value) => {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('aria-hidden', 'true');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '0';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.opacity = '0';
    input.style.fontSize = '16px';
    document.body.appendChild(input);
    input.focus({ preventScroll: true });
    input.select();
    input.setSelectionRange(0, input.value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    input.remove();
    return copied;
  };

  const copyText = async (value) => {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (_) {}
    }
    return legacyCopy(value);
  };

  const showCopyFeedback = (button, okText, idleText, copied) => {
    if (!button) return;
    clearTimeout(button._copyTimer);
    button.textContent = copied ? okText : '复制失败，请长按复制';
    button.setAttribute('aria-label', copied ? okText : '复制失败，请长按文字手动复制');
    button._copyTimer = setTimeout(() => {
      button.textContent = idleText;
      button.removeAttribute('aria-label');
    }, copied ? 1600 : 2600);
  };

  document.querySelector('[data-copy-wechat]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const value = document.querySelector('[data-wechat-id]')?.textContent?.trim();
    if (!value) return;
    const copied = await copyText(value);
    showCopyFeedback(button, '微信号已复制', '复制微信号', copied);
  });

  document.querySelector('[data-copy-email]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const value = button.dataset.email?.trim();
    if (!value) return;
    const copied = await copyText(value);
    showCopyFeedback(button, '邮箱已复制', '复制邮箱', copied);
  });

  const trapFocus = (container, event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...container.querySelectorAll('a[href], button:not([disabled]), [tabindex]')]
      .filter((el) => el.tabIndex >= 0 && !el.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenu(false);
      setModal(false);
      return;
    }
    if (modal?.classList.contains('open')) trapFocus(modal, event);
    else if (menu?.classList.contains('open')) trapFocus(menu, event);
  });

  // Same-origin document navigation gets a tiny exit cue. Hash scrolling and
  // external/live-demo links remain immediate and keep native browser behavior.
  if (!reducedMotion) {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

      let target;
      try { target = new URL(link.href, window.location.href); } catch (_) { return; }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname && target.search === window.location.search && target.hash) return;

      event.preventDefault();
      document.body.classList.add('page-leaving');
      window.setTimeout(() => { window.location.href = target.href; }, 165);
    });
    window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));
  }

  document.querySelectorAll('[data-year]').forEach((el) => el.textContent = new Date().getFullYear());
})();
