const DRAWER_QUERY = '(max-width: 1279px)';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const NAVIGATION_CONTROL_SELECTOR = 'a[href], button:not([disabled]), [tabindex]';

export function initQuickNavigation() {
  const navigation = document.getElementById('quickNav');
  const openButton = document.getElementById('quickNavToggle');
  const closeButton = document.getElementById('quickNavClose');
  const backdrop = document.getElementById('quickNavBackdrop');

  if (!navigation || !openButton || !closeButton || !backdrop || navigation.dataset.ready === 'true') return;
  navigation.dataset.ready = 'true';

  const drawerMedia = window.matchMedia(DRAWER_QUERY);
  const groupButtons = [...navigation.querySelectorAll('.quick-nav-group-toggle')];
  const sectionLinks = [...navigation.querySelectorAll('.quick-nav-link')];
  let returnFocus = null;

  function setGroupExpanded(button, expanded) {
    const submenu = document.getElementById(button.getAttribute('aria-controls'));
    if (!submenu) return;
    button.setAttribute('aria-expanded', String(expanded));
    submenu.hidden = !expanded;
  }

  function revealLinkGroup(link) {
    const submenu = link.closest('.quick-nav-submenu');
    if (!submenu) return;
    const button = navigation.querySelector(`[aria-controls="${submenu.id}"]`);
    if (button) setGroupExpanded(button, true);
  }

  function markCurrentLink(hash = window.location.hash) {
    sectionLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.setAttribute('aria-current', 'location');
        revealLinkGroup(link);
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function setNavigationInteractive(interactive) {
    if (interactive) {
      navigation.removeAttribute('aria-hidden');
      navigation.removeAttribute('inert');
      navigation.querySelectorAll('[data-quick-nav-tabindex]').forEach(element => {
        const previousTabindex = element.dataset.quickNavTabindex;
        if (previousTabindex) element.setAttribute('tabindex', previousTabindex);
        else element.removeAttribute('tabindex');
        delete element.dataset.quickNavTabindex;
      });
      return;
    }

    navigation.setAttribute('aria-hidden', 'true');
    navigation.setAttribute('inert', '');
    navigation.querySelectorAll(NAVIGATION_CONTROL_SELECTOR).forEach(element => {
      if (element.dataset.quickNavTabindex === undefined) {
        element.dataset.quickNavTabindex = element.getAttribute('tabindex') || '';
      }
      element.setAttribute('tabindex', '-1');
    });
  }

  function openNavigation() {
    if (!drawerMedia.matches) return;
    returnFocus = document.activeElement;
    setNavigationInteractive(true);
    document.body.classList.add('quick-nav-open');
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }

  function closeNavigation(restoreFocus = true) {
    const wasOpen = document.body.classList.contains('quick-nav-open');
    document.body.classList.remove('quick-nav-open');
    openButton.setAttribute('aria-expanded', 'false');
    setNavigationInteractive(!drawerMedia.matches);
    if (wasOpen && restoreFocus && returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  function followQuickLink(event) {
    const link = event.currentTarget;
    const hash = link.getAttribute('href');
    const target = hash ? document.querySelector(hash) : null;
    if (!target) return;

    event.preventDefault();
    closeNavigation(false);
    markCurrentLink(hash);

    const historyMethod = window.location.hash === hash ? 'replaceState' : 'pushState';
    window.history[historyMethod](null, '', hash);
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function keepFocusInDrawer(event) {
    if (event.key !== 'Tab' || !drawerMedia.matches || !document.body.classList.contains('quick-nav-open')) return;
    const focusable = [...navigation.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element => !element.closest('[hidden]'));
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
  }

  groupButtons.forEach(button => {
    button.addEventListener('click', () => {
      setGroupExpanded(button, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  navigation.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', followQuickLink));
  openButton.addEventListener('click', openNavigation);
  closeButton.addEventListener('click', () => closeNavigation());
  backdrop.addEventListener('click', () => closeNavigation());

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('quick-nav-open')) closeNavigation();
    keepFocusInDrawer(event);
  });

  window.addEventListener('hashchange', () => markCurrentLink());
  const handleViewportChange = () => closeNavigation(false);
  if (typeof drawerMedia.addEventListener === 'function') drawerMedia.addEventListener('change', handleViewportChange);
  else drawerMedia.addListener(handleViewportChange);

  handleViewportChange();
  markCurrentLink();
}
