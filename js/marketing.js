document.getElementById('marketingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        tarikh: this.tarikh.value,
        spend: this.spend.value,
        roas: this.roas.value,
        impressions: this.impressions.value
    };
    
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyD288YXO--KuUtrynCux07QwKaZ_kagzCdjl0Y9xJyHlhI5Z8apYnf_t5dTEHRI05a/exec';
    
    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('message').innerHTML = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong>Berjaya!</strong> Data telah disimpan ke Google Sheet.
                </div>
            `;
            this.reset();
        } else {
            throw new Error('Network response was not ok');
        }
    })
    .catch(error => {
        document.getElementById('message').innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong>Ralat!</strong> ${error.message}
            </div>
        `;
    });
});