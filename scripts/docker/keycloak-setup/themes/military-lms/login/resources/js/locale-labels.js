// Change language switcher labels to Arabic only
document.addEventListener('DOMContentLoaded', function() {
    const localeLinks = document.querySelectorAll('#kc-locale ul li a');
    localeLinks.forEach(link => {
        if (link.href.includes('kc_locale=ar')) {
            link.textContent = 'العربية';
        } else if (link.href.includes('kc_locale=en')) {
            link.textContent = 'الانجليزية';
        }
    });
});
