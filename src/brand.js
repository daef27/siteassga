(function () {
    const fallbackLogo = 'src/imagens/Assga_foto.jpg';

    function getConfig() {
        try {
            return JSON.parse(localStorage.getItem('assga_config') || '{}');
        } catch (error) {
            return {};
        }
    }

    function applyBrand() {
        const config = getConfig();
        const logo = config.logoImg && config.logoImg.startsWith('data:image')
            ? config.logoImg
            : fallbackLogo;
        const favicon = config.faviconImg && config.faviconImg.startsWith('data:image')
            ? config.faviconImg
            : logo;

        document.querySelectorAll('img').forEach(function (image) {
            if (image.dataset.brandLogo === 'true' || image.id === 'logoImgHeader' || image.closest('.logo-area, .header-logo, .login-box, .admin-auth-box, .carteira-header .logo')) {
                image.src = logo;
            }
        });

        document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach(function (link) {
            link.href = favicon;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyBrand);
    } else {
        applyBrand();
    }
})();
