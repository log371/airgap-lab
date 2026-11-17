'use strict';
const filters = document.querySelectorAll('[data-filter]');
const evidence = document.querySelectorAll('[data-state]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let visible = 0;
  evidence.forEach(item => {
    item.hidden = button.dataset.filter !== 'all' && item.dataset.state !== button.dataset.filter;
    if (!item.hidden) visible++;
  });
  document.querySelector('#filter-status').textContent = `${visible} élément(s) affiché(s).`;
}));
