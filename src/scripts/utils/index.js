export function showMessage(message, isError = false) {
  const container = document.querySelector('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'bg-red-600' : 'bg-black'}`;
  toast.innerText = message;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function createSkeleton(count = 3) {
  return Array(count).fill(`
    <div class="card-minimal h-[320px] p-6 space-y-4">
      <div class="skeleton h-48 w-full rounded-xl"></div>
      <div class="skeleton h-6 w-3/4"></div>
      <div class="skeleton h-4 w-full"></div>
    </div>
  `).join('');
}

export function showFormattedDate(date, locale = 'id-ID', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}
