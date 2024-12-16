document.addEventListener("DOMContentLoaded", () => {
    // Automatically complete substeps when all associated inputs are filled
    const substeps = document.querySelectorAll(".substeps li");
    
    function initializeCompletedSubsteps() {
    
        substeps.forEach(substep => {
            if (substep.classList.contains("completed")) {
                const checkIcon = substep.querySelector(".check-icon");
                if (checkIcon) {
                    checkIcon.innerText = "✔";
                } else {
                    console.error("No checkIcon found in substep:", substep);
                }
            }
        });
    }
    
    // Call the initialize function when the page loads
    initializeCompletedSubsteps();
    
    // Function to check if all inputs associated with a substep are filled
    function checkSubstepCompletion(substep) {
        const substepId = substep.dataset.substepId; // Get the unique identifier for the substep
        const associatedInputs = document.querySelectorAll(`[data-substep="${substepId}"]`);
    
        return Array.from(associatedInputs).every(input => {
            // Handle readonly inputs, dropdowns (select), checkboxes, and other inputs
            if (input.type === "checkbox") {
                return input.checked; // Checkbox must be checked
            } else if (input.hasAttribute("readonly")) {
                return input.value.trim() !== ""; // Readonly inputs must have a value
            } else if (input.tagName === "SELECT") {
                return input.value.trim() !== ""; // Dropdowns must have a selected value
            } else {
                return input.value.trim() !== ""; // Text inputs must be filled
            }
        });
    }

    // Mark substep as completed
    function markSubstepCompleted(substep) {
        substep.classList.add("completed");
        const checkIcon = substep.querySelector(".check-icon");
        if (checkIcon) {
            checkIcon.innerText = "✔";
        }
    
        // Check if the parent step should be marked as complete
        const parentStep = substep.closest(".step");
        const allSubsteps = parentStep.querySelectorAll("li");
        const allCompleted = Array.from(allSubsteps).every(
            (li) => li.classList.contains("completed")
        );
    
        if (allCompleted) {
            const stepNumber = parentStep.querySelector(".step-number");
            const stepTitle = parentStep.querySelector(".step-title");
            stepNumber.classList.add("completed");
            stepTitle.classList.add("completed");
        }
    }
    
    // Add event listeners to inputs associated with each substep
    substeps.forEach(substep => {
        const substepId = substep.dataset.substepId; // Get the unique identifier for the substep
        const associatedInputs = document.querySelectorAll(`[data-substep="${substepId}"]`);
        associatedInputs.forEach(input => {
            // Listen for changes in inputs
            if (!input.hasAttribute("readonly")) {
                // Only add event listeners for editable inputs
                input.addEventListener("input", () => {
                    if (checkSubstepCompletion(substep)) {
                        markSubstepCompleted(substep);
                    }
                });
    
                if (input.tagName === "SELECT" || input.type === "checkbox"){
                    input.addEventListener("change", () => {
                        if (checkSubstepCompletion(substep)) {
                            markSubstepCompleted(substep);
                        }
                    });
                }
            } else {
                // For readonly inputs, immediately check if the substep can be marked as completed
                if (checkSubstepCompletion(substep)) {
                    markSubstepCompleted(substep);
                }
            }
        });
    });
    });
    
    document.addEventListener("DOMContentLoaded", () => {
        console.log("HTML fully loaded and parsed!");
    
        // Get references to the table bodies
        const businessNatureTable = document.querySelector('.business-nature-table tbody');
        const updateCatalogTable = document.querySelector('.update-catalog-table tbody');
    
        // Add Row button for Business Natures
        const addBusinessRowButton = document.getElementById('add-business-nature-row');
        if (addBusinessRowButton) {
            addBusinessRowButton.addEventListener('click', () => {
                const newBusinessRow = document.createElement('tr');
                newBusinessRow.classList.add('business-nature-row');
                newBusinessRow.innerHTML = `
                    <td><input type="text" class="business-nature-code"></td>
                    <td><input type="text" class="business-nature-name"></td>
                    <td><i class="fa fa-remove remove-row"></i></td>
                `;
                businessNatureTable.appendChild(newBusinessRow);
                console.log("Add row");
            });
        } else {
            console.error("Button with ID 'add-business-nature-row' not found.");
        }
    
        // Remove Row button for Business Natures
        businessNatureTable.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-row')) {
                event.target.parentNode.parentNode.remove();
            }
        });
    
        // Add Row button for Update Catalog
        const addUpdateCatalogRow = document.getElementById('add-update-catalog-row');
        if (addUpdateCatalogRow) {
            addUpdateCatalogRow.addEventListener('click', () => {
                const newCatalogRow = document.createElement('tr');
                newCatalogRow.classList.add('update-catalog-row');
                newCatalogRow.innerHTML = `
                    <td><input type="text" class="item-code"></td>
                    <td><input type="text" class="item-name"></td>
                    <td><input type="text" class="item-details"></td>
                    <td><i class="fa fa-remove remove-row"></i></td>
                `;
                updateCatalogTable.appendChild(newCatalogRow);
            });
        } else {
            console.error("Button with ID 'add-update-catalog-row' not found.");
        }
    
        // Remove Row button for Update Catalog
        updateCatalogTable.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-row')) {
                event.target.parentNode.parentNode.remove();
            }
        });
    
        // Form validation example
        const form = document.querySelector('form');
    
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
    
                const ssmNo = document.getElementById('ssm_no')?.value;
                const businessType = document.getElementById('businessType')?.value;
                const businessNatures = [];
    
                const businessNatureRows = document.querySelectorAll('.business-nature-row');
                businessNatureRows.forEach(row => {
                    const code = row.querySelector('.business-nature-code').value;
                    const name = row.querySelector('.business-nature-name').value;
                    businessNatures.push({ code, name });
                });
    
                // Validate form data
                if (!ssmNo || !businessType || businessNatures.length === 0) {
                    alert('Please fill in all required fields.');
                    return;
                }
    
                // Submit form data
                fetch('/submit-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ssmNo,
                        businessType,
                        businessNatures
                    })
                })
                .then(response => {
                    console.log("Form successfully submitted.");
                })
                .catch(error => {
                    console.error('Error submitting form:', error);
                });
            });
        } else {
            console.error("Form not found.");
        }
    });
    