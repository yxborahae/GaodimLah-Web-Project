document.addEventListener("DOMContentLoaded", async () => {
    const tenderID = new URLSearchParams(window.location.search).get('tenderID');
    if (!tenderID) {
        alert("Tender ID is required.");
        return;
    }

    let provider;
    let contract;
    let contractAddress;
    let contractABI;

    // Fetch ABI and contract address from abi.json file
    const response = await fetch('../abi.json');
    const data = await response.json();

    contractAddress = data.address;
    contractABI = data.abi;

    // Connect to Ethereum network (MetaMask or other provider)
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            await provider.send("eth_requestAccounts", []); // Request user's accounts
            const signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log("Connected to contract:", contractAddress);

            // Fetch tender data based on tenderID
            const tenderData = await contract.getTenderBasicInfo(tenderID);

            const bidderAddress = await signer.getAddress();

            // Fetch the personal details of the signer (the current user)
            const userDetails = await contract.getUser(bidderAddress);

            // Populate the fields with the fetched tender data
            document.getElementById('bidder-id').value = bidderAddress;
            document.getElementById('tender-id').value = tenderID;
            document.getElementById('tender-name').value = tenderData[2];
            
            document.getElementById('bidder-name').value = userDetails.personalDetails.fullName;
            document.getElementById('contact-email').value = userDetails.personalDetails.email;
            document.getElementById('tel-no').value = userDetails.personalDetails.phone;

            // Populate the bid amount and proposal file from localStorage
            const bidAmount = localStorage.getItem('bidAmount');
            const proposalFile = localStorage.getItem('proposalFile');

            if (bidAmount) {
                document.getElementById('bid-amount').value = bidAmount;
            }

            // Enable the file upload input if a proposal file was uploaded earlier
            if (proposalFile) {
                document.getElementById('upload-proposal').disabled = false;
            }

            // Handle submit button click event
            document.getElementById('submit-btn').addEventListener('click', async () => {
                event.preventDefault(); 
                
                const agreeCheckbox = document.getElementById('agree');

                // Check if the declaration checkbox is checked
                if (!agreeCheckbox.checked) {
                    alert("Please confirm that all information is accurate.");
                    return;
                }

                if (!proposalFile) {
                    alert("Please upload your proposal file.");
                    return;
                }

                // Prepare the bid submission details
                const bidID = `${bidderAddress}-${Date.now()}`; // Generate a unique bid ID based on timestamp
                const bidInput = {
                    tenderID,
                    bidID,
                    title: tenderData[2],
                    amount: ethers.utils.parseUnits(bidAmount, "ether"), // Assuming bid amount is in Ether
                    proposalFile: proposalFile, // You may want to store the file in IPFS and provide the hash
                };

                try {
                    // Submit the bid to the blockchain
                    const tx = await contract.submitBid(bidInput);
                    await tx.wait(); // Wait for the transaction to be mined
                    alert("Bid submitted successfully!");
                    window.location.href = './tender_main.html'; // Redirect to confirmation page
                } catch (error) {
                    console.error("Error submitting bid:", error);
                    alert("Error submitting the bid. Please try again.");
                }
            });
            
            // Back button functionality
            document.getElementById('back-btn').addEventListener('click', () => {
                // Redirect to the previous page with the tenderID in the query string
                window.location.href = `./bid_participation_form.html?tenderID=${tenderID}`;
            });

        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Error connecting to MetaMask. Please try again.");
        }
    } else {
        alert("Please install MetaMask to interact with the blockchain.");
    }
});

// Edit button toggles the readonly state of the fields
document.getElementById('edit-btn').addEventListener('click', function() {
    const bidderInputs = document.querySelectorAll('#bid-amount');
    const uploadProposalInput = document.getElementById('upload-proposal');
    
    bidderInputs.forEach(input => {
        input.readOnly = !input.readOnly;
    });

    uploadProposalInput.disabled = !uploadProposalInput.disabled;

    const editIcon = this.querySelector('i');
    if (editIcon.classList.contains('fa-edit')) {
        editIcon.classList.remove('fa-edit');
        editIcon.classList.add('fa-circle-check');  
    } else {
        editIcon.classList.remove('fa-circle-check');
        editIcon.classList.add('fa-edit');  
    }
});

