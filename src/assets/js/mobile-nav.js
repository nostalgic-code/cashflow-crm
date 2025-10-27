document.addEventListener('DOMContentLoaded', function() {
    const mobileNavTogglers = document.querySelectorAll('.mobile-nav__toggler');
    const mobileNavWrapper = document.querySelector('.mobile-nav__wrapper');
    const mobileContent = document.querySelector('.mobile-nav__content');
    const dropdowns = document.querySelectorAll('.mobile-nav__container .dropdown > a');
    
    mobileNavTogglers.forEach(function(toggler) {
        toggler.addEventListener('click', function(e) {
            e.preventDefault();
            mobileNavWrapper.classList.toggle('expanded');
            document.body.classList.toggle('active');
        });
    });

    // Close menu when clicking overlay
    const mobileNavOverlay = document.querySelector('.mobile-nav__overlay');
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', function() {
            mobileNavWrapper.classList.remove('expanded');
            document.body.classList.remove('active');
        });
    }

    // Close menu when clicking close button
    const mobileNavClose = document.querySelector('.mobile-nav__close');
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', function() {
            mobileNavWrapper.classList.remove('expanded');
            document.body.classList.remove('active');
        });
    });

    // Handle dropdown toggles
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            
            // Close other open dropdowns
            dropdowns.forEach(otherDropdown => {
                if (otherDropdown !== this) {
                    otherDropdown.parentElement.classList.remove('active');
                    if (otherDropdown.nextElementSibling) {
                        otherDropdown.nextElementSibling.style.display = 'none';
                    }
                }
            });
            
            parent.classList.toggle('active');
            
            // Toggle the visibility of the submenu
            const submenu = this.nextElementSibling;
            if (submenu) {
                if (parent.classList.contains('active')) {
                    submenu.style.display = 'block';
                } else {
                    submenu.style.display = 'none';
                }
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.mobile-nav__content') && !e.target.closest('.mobile-nav__toggler')) {
            if (mobileNavWrapper.classList.contains('expanded')) {
                mobileNavWrapper.classList.remove('expanded');
                document.body.classList.remove('active');
            }
        }
    });
});
