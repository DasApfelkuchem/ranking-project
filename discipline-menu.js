(() => {
  const disciplines = {
    flatland: 'Flatland',
    street: 'Street',
    trial: 'Trial',
    'x-style': 'X-Style'
  };
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('discipline');
  const discipline = Object.prototype.hasOwnProperty.call(disciplines, requested)
    ? requested
    : 'flatland';
  const label = disciplines[discipline];

  document.documentElement.dataset.discipline = discipline;
  document.querySelectorAll('[data-discipline-label]').forEach((element) => {
    element.textContent = label;
  });
  document.querySelectorAll('[data-discipline-select]').forEach((select) => {
    select.value = discipline;
    select.addEventListener('change', () => {
      const nextUrl = new URL(window.location.href);
      if (select.value === 'flatland') {
        nextUrl.searchParams.delete('discipline');
      } else {
        nextUrl.searchParams.set('discipline', select.value);
      }
      window.location.assign(nextUrl.toString());
    });
  });

  document.querySelectorAll('a[href]').forEach((link) => {
    const target = new URL(link.getAttribute('href'), window.location.href);
    if (target.origin !== window.location.origin) return;

    const isDisciplinePage = /\/(?:index|results|rider_points)\.html$/.test(target.pathname)
      || /\/$/.test(target.pathname);
    if (!isDisciplinePage) return;

    if (discipline === 'flatland') {
      target.searchParams.delete('discipline');
    } else {
      target.searchParams.set('discipline', discipline);
    }
    link.href = target.toString();
  });

  document.title = document.title.replace(/Flatland/i, label);
})();
