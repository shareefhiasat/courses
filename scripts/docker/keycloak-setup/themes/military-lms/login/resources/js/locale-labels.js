// Change language switcher labels to Arabic only
document.addEventListener('DOMContentLoaded', function() {
    const localeLinks = document.querySelectorAll('#kc-locale ul li a');
    const currentLocaleButton = document.getElementById('kc-current-locale-link');
    const currentUrl = new URL(window.location.href);
    const urlLocale = currentUrl.searchParams.get('kc_locale');
    const htmlElement = document.documentElement;
    const isRTL = htmlElement.getAttribute('dir') === 'rtl';
    const lang = htmlElement.getAttribute('lang') || 'en';
    
    // Determine current language: check URL parameter first, then dir/lang attributes
    let currentLocale = 'en';
    if (urlLocale) {
        currentLocale = urlLocale;
    } else if (isRTL && (lang === 'ar' || lang.includes('ar'))) {
        currentLocale = 'ar';
    }
    
    // Update button text to show current language
    if (currentLocaleButton) {
        currentLocaleButton.textContent = currentLocale === 'ar' ? 'العربية' : 'الانجليزية';
    }
    
    localeLinks.forEach(link => {
        if (link.href.includes('kc_locale=ar')) {
            link.textContent = 'العربية';
            // Highlight if Arabic is selected
            if (currentLocale === 'ar') {
                link.style.backgroundColor = '#8A1538';
                link.style.color = '#ffffff';
                link.style.fontWeight = 'bold';
            } else {
                link.style.backgroundColor = 'transparent';
                link.style.color = '#8A1538';
                link.style.fontWeight = '600';
            }
        } else if (link.href.includes('kc_locale=en')) {
            link.textContent = 'الانجليزية';
            // Highlight if English is selected
            if (currentLocale === 'en') {
                link.style.backgroundColor = '#8A1538';
                link.style.color = '#ffffff';
                link.style.fontWeight = 'bold';
            } else {
                link.style.backgroundColor = 'transparent';
                link.style.color = '#8A1538';
                link.style.fontWeight = '600';
            }
        }
    });

    // Fix checkbox label overlapping
    const checkboxLabels = document.querySelectorAll('.checkbox label');
    checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        const labelText = label.textContent.trim();
        if (checkbox && labelText) {
            // Remove the checkbox from the label
            checkbox.remove();
            // Clear the label text
            label.textContent = labelText;
            // Insert the checkbox before the label
            label.parentNode.insertBefore(checkbox, label);
            // Make label display inline
            label.style.display = 'inline';
            label.style.marginLeft = '8px';
            label.style.marginRight = '0';
            label.style.paddingRight = '12px';
            checkbox.style.marginRight = '0';
            checkbox.style.marginLeft = '0';
        }
    });

    // RTL checkbox and label margin
    if (htmlElement && htmlElement.getAttribute('dir') === 'rtl') {
        const checkboxes = document.querySelectorAll('.checkbox input[type="checkbox"]');
        const labels = document.querySelectorAll('.checkbox label');
        checkboxes.forEach(checkbox => {
            checkbox.style.marginRight = '0';
            checkbox.style.marginLeft = '0';
        });
        labels.forEach(label => {
            label.style.marginLeft = '0';
            label.style.marginRight = '8px';
        });
    }
});
