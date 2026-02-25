// Drag and Drop Logic
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('fileInput');

dropZone.onclick = () => fileInput.click();

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

dropZone.addEventListener('drop', (e) => {
    let files = e.dataTransfer.files;
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length > 0) {
        document.getElementById('upload-text').innerHTML = `<strong>Selected:</strong> ${files[0].name}`;
        updateCalculator();
    }
}

// Modal Pop-up Logic
function openProjectDetails(type) {
    const modal = document.getElementById('studioModal');
    const body = document.getElementById('modalBody');
    
    if (type === 'planter') {
        body.innerHTML = `
            <h2>Geometric Planter</h2>
            <p>Architectural interior piece optimized for Ender 6.</p>
            <ul>
                <li>Dimensions: 120mm x 120mm</li>
                <li>Material: Matte White PLA</li>
            </ul>
            <button class="btn-outline" onclick="addToBag({name: 'Planter', price: 'R 250'})">Add to Bag</button>
        `;
    }
    
    modal.classList.add('active');
}

function handleProjectTypeChange() {
    const type = document.getElementById('projectType').value;
    if (type === 'custom') {
        const modal = document.getElementById('studioModal');
        document.getElementById('modalBody').innerHTML = `
            <h2>Request Custom Design</h2>
            <p>Tell us about your project requirements.</p>
            <textarea placeholder="Dimensions, purpose, deadline..." class="shop-input" style="width: 100%; height: 100px; margin: 20px 0;"></textarea>
            <button class="btn-outline" onclick="closeModal()">Submit Request</button>
        `;
        modal.classList.add('active');
    }
}

function closeModal() {
    document.getElementById('studioModal').classList.remove('active');
}