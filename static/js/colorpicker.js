// Small popup palette picker, shared by the players and new-game pages.
// Usage: SkullKingColors.openPicker(anchorEl, paletteArray, currentColor, (color) => { ... });
(function () {
    function closeOpenPicker() {
        const existing = document.querySelector('.color-picker-popup');
        if (existing) existing.remove();
    }

    function openPicker(anchorEl, palette, currentColor, onSelect) {
        closeOpenPicker();

        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';

        palette.forEach((color) => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'color-swatch';
            if (currentColor && color.toLowerCase() === currentColor.toLowerCase()) {
                swatch.classList.add('selected');
            }
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeOpenPicker();
                onSelect(color);
            });
            popup.appendChild(swatch);
        });

        document.body.appendChild(popup);

        const rect = anchorEl.getBoundingClientRect();
        popup.style.top = `${window.scrollY + rect.bottom + 4}px`;
        popup.style.left = `${window.scrollX + rect.left}px`;

        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!popup.contains(e.target) && e.target !== anchorEl) {
                    popup.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 0);
    }

    window.SkullKingColors = { openPicker };
})();
