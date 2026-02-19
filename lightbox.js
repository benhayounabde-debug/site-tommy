// ===== Lightbox Configurator =====

// Prix de base
const basePrices = {
    'S': 39.99,
    'M': 49.99,
    'L': 64.99
};

const shippingPrices = {
    'S': 9.90,
    'M': 9.90,
    'L': 14.90
};

// État du configurateur
let config = {
    size: 'M',
    shape: 'rectangle',
    color: 'noir',
    led: 'blanc-chaud',
    quantity: 1,
    photo: null,
    text: '',
    extraInfo: ''
};

// Mise à jour du prix
function updatePrice() {
    let price = basePrices[config.size];

    // Supplément RGB
    if (config.led === 'rgb') {
        price += 5;
    }

    const subtotal = price * config.quantity;
    const shipping = shippingPrices[config.size];
    const total = subtotal + shipping;

    document.getElementById('totalPrice').textContent = total.toFixed(2).replace('.', ',') + '€';
    document.getElementById('btnPrice').textContent = total.toFixed(2).replace('.', ',') + '€';

    // Afficher les frais de livraison
    const shippingEl = document.getElementById('shippingPrice');
    if (shippingEl) {
        shippingEl.textContent = shipping.toFixed(2).replace('.', ',') + '€';
    }
    const subtotalEl = document.getElementById('subtotalPrice');
    if (subtotalEl) {
        subtotalEl.textContent = subtotal.toFixed(2).replace('.', ',') + '€';
    }
}

// Gestion des tailles
document.querySelectorAll('input[name="size"]').forEach(input => {
    input.addEventListener('change', (e) => {
        config.size = e.target.value;
        updatePrice();
    });
});

// Gestion des formes
document.querySelectorAll('input[name="shape"]').forEach(input => {
    input.addEventListener('change', (e) => {
        config.shape = e.target.value;
        updateLightboxPreview();
    });
});

// Gestion des couleurs (menu déroulant)
const colorSelect = document.getElementById('colorSelect');
const colorPreviewDot = document.getElementById('colorPreviewDot');
colorSelect.addEventListener('change', (e) => {
    config.color = e.target.value;
    const selectedOption = e.target.options[e.target.selectedIndex];
    colorPreviewDot.style.background = selectedOption.getAttribute('data-color');
    updateLightboxPreview();
});

// Gestion des LED
document.querySelectorAll('input[name="led"]').forEach(input => {
    input.addEventListener('change', (e) => {
        config.led = e.target.value;
        updatePrice();
        updateLightboxPreview();
    });
});

// Gestion de la quantité
const qtyInput = document.getElementById('quantity');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');

qtyMinus.addEventListener('click', () => {
    if (config.quantity > 1) {
        config.quantity--;
        qtyInput.value = config.quantity;
        updatePrice();
    }
});

qtyPlus.addEventListener('click', () => {
    if (config.quantity < 10) {
        config.quantity++;
        qtyInput.value = config.quantity;
        updatePrice();
    }
});

qtyInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value);
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    config.quantity = val;
    qtyInput.value = val;
    updatePrice();
});

// Gestion de l'upload photo
const uploadZone = document.getElementById('uploadZone');
const photoUpload = document.getElementById('photoUpload');
const uploadPreview = document.getElementById('uploadPreview');
const previewImage = document.getElementById('previewImage');
const removePhoto = document.getElementById('removePhoto');

uploadZone.addEventListener('click', () => {
    photoUpload.click();
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

photoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

function handleFileUpload(file) {
    if (file.size > 50 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Maximum 50 Mo.');
        return;
    }

    config.photo = file;
    config.fileName = file.name;
    config.fileType = file.type;

    const previewContent = document.getElementById('previewContent');

    // Si c'est une image, afficher l'aperçu
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            config.photoData = e.target.result;
            previewContent.innerHTML = `<img src="${e.target.result}" alt="Aperçu" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px;">`;
            updateLightboxPreview();
        };
        reader.readAsDataURL(file);
    } else {
        // Pour les autres fichiers, afficher le nom et l'icône
        const icon = getFileIcon(file.name);
        previewContent.innerHTML = `
            <div class="file-preview">
                <span class="file-icon">${icon}</span>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
        config.photoData = null;
        updateLightboxPreview();
    }

    uploadZone.style.display = 'none';
    uploadPreview.style.display = 'block';
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'svg': '🎨',
        'ai': '🎨',
        'psd': '🖼️',
        'stl': '🧊',
        'obj': '🧊',
        '3mf': '🧊',
        'step': '🧊',
        'iges': '🧊',
        'doc': '📝',
        'docx': '📝',
        'zip': '📦',
        'rar': '📦'
    };
    return icons[ext] || '📁';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

removePhoto.addEventListener('click', () => {
    config.photo = null;
    photoUpload.value = '';
    uploadZone.style.display = 'block';
    uploadPreview.style.display = 'none';
    updateLightboxPreview();
});

// Gestion du texte personnalisé
const customText = document.getElementById('customText');
customText.addEventListener('input', (e) => {
    config.text = e.target.value;
});

// Gestion des infos complémentaires
const extraInfo = document.getElementById('extraInfo');
extraInfo.addEventListener('input', (e) => {
    config.extraInfo = e.target.value;
});

// Mise à jour de l'aperçu lightbox
function updateLightboxPreview() {
    const preview = document.getElementById('lightboxPreview');
    const lightboxContent = preview.querySelector('.lightbox-content');
    const lightboxGlow = preview.querySelector('.lightbox-glow');

    // Couleur du cadre
    const frameColors = {
        'noir': '#1a1a1a', 'blanc': '#f5f5f5', 'gris': '#808080',
        'bois-clair': '#D2B48C', 'bois-fonce': '#8B4513',
        'rouge': '#C0392B', 'bleu-nuit': '#1B2631', 'bleu-ciel': '#5DADE2',
        'vert-foret': '#1E8449', 'vert-sauge': '#A9B9A3',
        'rose': '#E8A0BF', 'violet': '#7D3C98',
        'jaune-moutarde': '#D4AC0D', 'orange': '#E67E22', 'beige': '#C7ADA5',
        'bordeaux': '#78281F', 'turquoise': '#1ABC9C',
        'or': '#D4AF37', 'argent': '#C0C0C0', 'cuivre': '#B87333'
    };
    const frame = preview.querySelector('.lightbox-frame');
    frame.style.borderColor = frameColors[config.color] || '#1a1a1a';

    // Forme du cadre
    const shapeStyles = {
        'rectangle': { aspectRatio: '4/3', clipPath: 'none', borderRadius: '12px' },
        'carre': { aspectRatio: '1/1', clipPath: 'none', borderRadius: '12px' },
        'triangle': { aspectRatio: '1/1', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', borderRadius: '0' },
        'ovale': { aspectRatio: '4/3', clipPath: 'none', borderRadius: '50%' },
        'rond': { aspectRatio: '1/1', clipPath: 'none', borderRadius: '50%' },
        'contour': { aspectRatio: '1/1', clipPath: 'none', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }
    };
    const shape = shapeStyles[config.shape] || shapeStyles['rectangle'];
    frame.style.aspectRatio = shape.aspectRatio;
    frame.style.clipPath = shape.clipPath;
    frame.style.borderRadius = shape.borderRadius;

    // Couleur LED
    const ledColors = {
        'blanc-chaud': 'rgba(255, 228, 181, 0.6)',
        'blanc-froid': 'rgba(240, 248, 255, 0.6)',
        'rgb': 'linear-gradient(45deg, rgba(255,0,0,0.4), rgba(0,255,0,0.4), rgba(0,0,255,0.4))'
    };

    if (config.led === 'rgb') {
        lightboxGlow.style.background = ledColors[config.led];
    } else {
        lightboxGlow.style.background = `radial-gradient(circle, ${ledColors[config.led]} 0%, transparent 70%)`;
    }

    // Fichier uploadé
    if (config.photo && config.photoData) {
        // C'est une image
        lightboxContent.innerHTML = `<img src="${config.photoData}" alt="Votre image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    } else if (config.photo && config.fileName) {
        // C'est un autre type de fichier
        const icon = getFileIcon(config.fileName);
        lightboxContent.innerHTML = `
            <span class="lightbox-icon">${icon}</span>
            <p style="font-size: 12px;">${config.fileName}</p>
        `;
    } else {
        lightboxContent.innerHTML = `
            <span class="lightbox-icon">💡</span>
            <p>Votre fichier ici</p>
        `;
    }
}

// Bouton Commander
const addToCart = document.getElementById('addToCart');
// Upload vers Cloudinary
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'lnidwx3m');
        formData.append('folder', 'commandes');
        fetch('https://api.cloudinary.com/v1_1/dpl7tgj6u/auto/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.secure_url) resolve(data.secure_url);
            else reject(data.error || 'Upload failed');
        })
        .catch(reject);
    });
}

addToCart.addEventListener('click', async () => {
    if (!config.photo) {
        alert('Veuillez uploader un fichier pour personnaliser votre lightbox.');
        uploadZone.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Récapitulatif de la commande
    const shapeLabels = { 'rectangle': 'Rectangle', 'carre': 'Carré', 'triangle': 'Triangle', 'ovale': 'Ovale', 'rond': 'Rond', 'contour': 'Contour image' };
    const recap = `
Récapitulatif de votre commande :
- Fichier : ${config.fileName}
- Taille : ${config.size}
- Forme : ${shapeLabels[config.shape] || config.shape}
- Couleur cadre : ${config.color}
- Éclairage : ${config.led}
- Quantité : ${config.quantity}
- Texte : ${config.text || '(aucun)'}
- Infos complémentaires : ${config.extraInfo || '(aucune)'}
- Total : ${document.getElementById('totalPrice').textContent}

Pour finaliser votre commande, vous allez être redirigé vers la page contact.
    `;

    if (confirm(recap)) {
        const btn = document.getElementById('addToCart');
        btn.querySelector('span').textContent = 'Envoi du fichier...';
        btn.disabled = true;

        // Upload vers Cloudinary
        let fileUrl = null;
        if (config.photo) {
            try {
                fileUrl = await uploadToCloudinary(config.photo);
            } catch (err) {
                console.error('Cloudinary upload error:', err);
                alert('Erreur upload fichier : ' + JSON.stringify(err));
            }
        }

        if (!fileUrl) {
            alert('Le fichier n\'a pas pu être envoyé. Vérifiez votre connexion et réessayez.');
            btn.querySelector('span').textContent = 'Commander maintenant';
            btn.disabled = false;
            return;
        }

        // Stocker la config dans localStorage pour la page contact
        localStorage.setItem('lightboxOrder', JSON.stringify({
            fileName: config.fileName,
            fileType: config.fileType,
            fileUrl: fileUrl,
            size: config.size,
            shape: config.shape,
            color: config.color,
            led: config.led,
            quantity: config.quantity,
            text: config.text,
            extraInfo: config.extraInfo,
            price: document.getElementById('totalPrice').textContent
        }));

        window.location.href = 'contact.html';
    }
});

// Galerie thumbs - Changement d'image principale
function changeMainImage(imageUrl, thumbElement) {
    // Mettre à jour l'image principale
    const mainImage = document.getElementById('mainPreviewImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }

    // Mettre à jour la classe active sur les thumbnails
    document.querySelectorAll('.gallery-thumbs .thumb').forEach(t => t.classList.remove('active'));
    if (thumbElement) {
        thumbElement.classList.add('active');
    }
}

document.querySelectorAll('.gallery-thumbs .thumb').forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
        document.querySelectorAll('.gallery-thumbs .thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
    });
});

// Initialisation
updatePrice();
updateLightboxPreview();
