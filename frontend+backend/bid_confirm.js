document.getElementById('edit-btn').addEventListener('click', function() {
    // Get the input fields in the bidder details section
    const bidderInputs = document.querySelectorAll('#bid-amount');
    const uploadProposalInput = document.getElementById('upload-proposal');
    
    // Toggle readonly state for each input field
    bidderInputs.forEach(input => {
        input.readOnly = !input.readOnly;
    });

    // Toggle the disabled state for the upload proposal input
    uploadProposalInput.disabled = !uploadProposalInput.disabled;

    // Toggle the edit icon
    const editIcon = this.querySelector('i');
    if (editIcon.classList.contains('fa-edit')) {
        editIcon.classList.remove('fa-edit');
        editIcon.classList.add('fa-circle-check');  
    } else {
        editIcon.classList.remove('fa-circle-check');
        editIcon.classList.add('fa-edit');  
    }
});
