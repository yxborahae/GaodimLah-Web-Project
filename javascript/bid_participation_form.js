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
            
            // Fetch the personal details of the signer (the current user)
            const userDetails = await contract.getUser(await signer.getAddress());


            // Populate the fields with the fetched tender data
            document.getElementById('tender-id').value = tenderID;
            document.getElementById('tender-name').value = tenderData[2];
            
            document.getElementById('bidder-name').value = userDetails.personalDetails.fullName;
            document.getElementById('contact-email').value = userDetails.personalDetails.email;
            document.getElementById('tel-no').value = userDetails.personalDetails.phone;

            // Back button functionality
            document.getElementById('back-btn').addEventListener('click', () => {
              const tenderID = new URLSearchParams(window.location.search).get('tenderID');
              // Redirect to the previous page with the tenderID in the query string
              window.location.href = `./ongoing_project.html?tenderID=${tenderID}`;
          });

        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Error connecting to MetaMask. Please try again.");
        }
    } else {
        alert("Please install MetaMask to interact with the blockchain.");
    }
});

let isSuccess = false;

document.getElementById('next-btn').addEventListener('click',function () {
  const tenderID = new URLSearchParams(window.location.search).get('tenderID');
  
  const bidAmount = document.getElementById('bid-amount').value;
  const proposalFile = document.getElementById('upload-proposal').files[0];

  if (!bidAmount || !proposalFile) {
    alert('Please fill in the bid amount and upload a proposal file.');
    return;
  }

  if (isSuccess) {
    localStorage.setItem('bidAmount', bidAmount);
    localStorage.setItem('proposalFile', proposalFile.name);
    window.location.href = `./bid_confirm.html?tenderID=${tenderID}`; // Redirect to bid_confirm page
  }else{
    alert('A token transfer is required before proceed to bid confirmation.');
  }
});

// Proceed transfer logic (similar to your existing one)
document.getElementById('proceed-transfer').addEventListener('click', function () {
alert('Transfer process initiated!');
isSuccess = true;
const buttonContainer = document.getElementById('proceed-transfer').parentElement;

buttonContainer.innerHTML = '';

const messageDiv = document.createElement('div');
messageDiv.classList.add('alert');
messageDiv.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
messageDiv.classList.add('d-flex', 'align-items-center');

const icon = document.createElement('i');
icon.classList.add('fa-solid', 'fa-circle-dollar-to-slot');
icon.style.marginRight = '10px';
icon.style.color = isSuccess ? 'green' : 'red';

const messageText = document.createTextNode(isSuccess ? 'TRANSFER SUCCESSFUL' : 'TRANSFER FAIL');
messageDiv.appendChild(icon);
messageDiv.appendChild(messageText);
buttonContainer.appendChild(messageDiv);
});


