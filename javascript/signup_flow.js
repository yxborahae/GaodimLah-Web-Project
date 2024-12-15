// // Get references to the table bodies
// const businessNatureTable = document.querySelector('.business-nature-table tbody');
// const updateCatalogTable = document.querySelector('.update-catalog-table tbody');

// // Add Row button for Business Natures
// const addBusinessRowButton = document.getElementById('add-business-nature-row');
// addBusinessRowButton.addEventListener('click', () => {
//     const newBusinessRow = document.createElement('tr');
//     newBusinessRow.classList.add('business-nature-row');
//     newBusinessRow.innerHTML = `
//         <td><input type="text" class="business-nature-code"></td>
//         <td><input type="text" class="business-nature-name"></td>
//         <td><i class="fa fa-remove remove-row"></i></td>
//     `;
//     businessNatureTable.appendChild(newBusinessRow);
// });
// // Remove Row button for Business Natures
// businessNatureTable.addEventListener('click', (event) => {
//     if (event.target.classList.contains('remove-row')) {
//         event.target.parentNode.parentNode.remove();
//     }
// });

// // Add Row button for Update Catalog
// const addUpdateCatalogRow = document.getElementById('add-update-catalog-row');
// addUpdateCatalogRow.addEventListener('click',()=>{
//     const newCatalogRow = document.createElement('tr');
//     newCatalogRow.classList.add('update-catalog-row');
//     newCatalogRow.innerHTML = `
//         <td><input type="text" class="item-code"></td>
//         <td><input type="text" class="item-name"></td>
//         <td><input type="text" class="item-details"></td>
//         <td><i class="fa fa-remove remove-row"></i></td>
//     `;
//     updateCatalogTable.appendChild(newCatalogRow);
// });
// //Remove Row button for Update Catalog
// updateCatalogTable.addEventListener('click',(event)=>{
//     if(event.target.classList.contains('remove-row')){
//         event.target.parentNode.parentNode.remove();
//     }
// });

// // Form validation example (adjust to your specific needs)
// const form = document.querySelector('form');

// form.addEventListener('submit', (event) => {
//     event.preventDefault();

//     const ssmNo = document.getElementById('ssm_no').value;
//     const businessType = document.getElementById('businessType').value;
//     const businessNatures = [];

//     const businessNatureRows = document.querySelectorAll('.business-nature-row');
//     businessNatureRows.forEach(row => {
//         const code = row.querySelector('.business-nature-code').value;
//         const name = row.querySelector('.business-nature-name').value;
//         businessNatures.push({ code, name });
//     });

//     // Validate form data here
//     if (!ssmNo || !businessType || businessNatures.length === 0) {
//         alert('Please fill in all required fields.');
//         return;
//     }

//     // Submit form data to server (replace with your actual server-side logic)
//     fetch('/submit-form', {
//         method: 'POST',
//         body: JSON.stringify({
//             ssmNo,
//             businessType,
//             businessNatures
//         })
//     })
//     .then(response => {
//         // Handle server response
//     })
//     .catch(error => {
//         // Handle errors
//     });
// });
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
