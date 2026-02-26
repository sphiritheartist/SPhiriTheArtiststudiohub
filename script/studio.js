// studio.js — wrapped in DOMContentLoaded to prevent null crashes

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', function() { fileInput.click(); });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', function() { dropZone.classList.add('highlight'); });
    dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('highlight'); });

    dropZone.addEventListener('drop', function(e) {
        dropZone.classList.remove('highlight');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(fileInput.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const uploadText = document.getElementById('upload-text');
            if (uploadText) {
                uploadText.innerHTML = '<strong>Selected:</strong> ' + files[0].name;
            }
            if (typeof window.updateCalculator === 'function') window.updateCalculator();
        }
    }
});

// Modal functions — called inline via onclick attributes, so must be global
function openProjectDetails(type) {
    const modal = document.getElementById('studioModal');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;

    if (type === 'planter') {
        body.innerHTML =
            '<h2>Geometric Planter</h2>' +
            '<p>Architectural interior piece optimised for Ender 6.</p>' +
            '<ul style="margin: 15px 0 25px; padding-left: 20px;">' +
                '<li>Dimensions: 120mm x 120mm</li>' +
                '<li>Material: Matte White PLA</li>' +
                '<li>Est. print time: 4–6 hours</li>' +
            '</ul>' +
            '<button class="btn-outline" onclick="window.addToBag({name: \'Geometric Planter\', price: \'R 250.00\'})">Add to Bag — R 250</button>';
    } else if (type === 'gear') {
        body.innerHTML =
            '<h2>Mechanical Assembly</h2>' +
            '<p>Industrial gear set engineered for display or functional prototyping.</p>' +
            '<ul style="margin: 15px 0 25px; padding-left: 20px;">' +
                '<li>Dimensions: 85mm diameter</li>' +
                '<li>Material: Standard PLA</li>' +
                '<li>Est. print time: 3–5 hours</li>' +
            '</ul>' +
            '<button class="btn-outline" onclick="window.addToBag({name: \'Mechanical Assembly\', price: \'R 200.00\'})">Add to Bag — R 200</button>';
    }

    modal.classList.add('active');
}

function handleProjectTypeChange() {
    const typeEl = document.getElementById('projectType');
    if (!typeEl) return;
    const type = typeEl.value;
    if (type === 'custom') {
        const modal = document.getElementById('studioModal');
        const body = document.getElementById('modalBody');
        if (!modal || !body) return;
        body.innerHTML =
            '<h2>Request Custom Design</h2>' +
            '<p>Tell us about your project requirements.</p>' +
            '<textarea placeholder="Dimensions, purpose, deadline..." class="shop-input" style="width:100%; height:120px; margin:20px 0; padding:15px; border-radius:12px; border:1.5px solid var(--system-border); background:var(--system-secondary); color:var(--system-text); font-family:inherit; font-size:14px; resize:vertical;"></textarea>' +
            '<button class="btn-outline" onclick="closeModal()">Submit Request</button>';
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('studioModal');
    if (modal) modal.classList.remove('active');
}