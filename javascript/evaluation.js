const tenderID = new URLSearchParams(window.location.search).get('tenderID');
const bidID = new URLSearchParams(window.location.search).get('bidID');

const titleContainer = document.getElementById("tender-title");
const bidIDContainer = document.getElementById("bid-id");
const infoContainer = document.getElementById("info");

// Initialize the provider and contract
window.onload = async function init() {
  let provider;
  let contract;
  let contractAddress;
  let contractABI;

  // Fetch ABI and contract address from abi.json file
  const response = await fetch('../abi.json'); 
  const data = await response.json();
  contractAddress = data.address; 
  contractABI = data.abi;

  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []); 
    const signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("Connected to contract:", contractAddress);

    console.log('Tender ID: ' + tenderID);
    console.log('Bid ID: ' + bidID);

    const contractData = await contract.getTenderBasicInfo(tenderID);
    
    const title = contractData[2];
    const ministry = contractData[3];
    const budget = contractData[4]/10000000000000000000;
    const publishDate = new Date(Number(contractData[5]) * 1000).toLocaleString();
    const closingDate = new Date(Number(contractData[6]) * 1000).toLocaleString();
    const deadline = new Date(Number(contractData[7]) * 1000).toLocaleString();

    titleContainer.innerHTML = `<h3 class="tender-title" id="tender-title">${title}</h3>`;
    bidIDContainer.innerHTML = `<h2 id="bid-id"><span>Bid ID: </span>${bidID}</h2>`;
    infoContainer.innerHTML = `
        <div class="contract-info">
        <div class="info-row">
            <span class="info-label">Project Title</span>
            <span class="info-value">: ${title}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Ministry</span>
            <span class="info-value">: ${ministry}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Budget Amount</span>
            <span class="info-value">: RM ${budget}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Publish Date</span>
            <span class="info-value">: ${publishDate}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Closing Date</span>
            <span class="info-value">: ${closingDate}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Deadline</span>
            <span class="info-value">: ${deadline}</span>
        </div>
    </div>
    `;

  } else {
    alert("Please install MetaMask to interact with the blockchain.");
  }
};

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `evaluate_list.html?tenderID=${tenderID}`;
});

const done = document.getElementById('done-btn');
done.addEventListener('click', function () {
    // Show confirmation dialog
    const isConfirmed = confirm("Are you sure the evaluation of this bid is complete?");
    if (isConfirmed) {
        // Navigate to the next page if confirmed
        window.location.href = `evaluate_list.html?tenderID=${tenderID}`;
    }
});

// slider logic
const slider1 = document.getElementById("slider1");
const slider2 = document.getElementById("slider2");
const slider3 = document.getElementById("slider3");
const slider4 = document.getElementById("slider4");
const slider5 = document.getElementById("slider5");
const slider6 = document.getElementById("slider6");
const slider7 = document.getElementById("slider7");
const slider8 = document.getElementById("slider8");

const value1 = document.getElementById('value1');
const value2 = document.getElementById('value2');
const value3 = document.getElementById('value3');
const value4 = document.getElementById('value4');
const value5 = document.getElementById('value5');
const value6 = document.getElementById('value6');
const value7 = document.getElementById('value7');
const value8 = document.getElementById('value8');

value1.textContent = slider1.value;
value2.textContent = slider2.value;
value3.textContent = slider3.value;
value4.textContent = slider4.value;
value5.textContent = slider5.value;
value6.textContent = slider6.value;
value7.textContent = slider7.value;
value8.textContent = slider8.value;

slider1.oninput =function(){
    value1.textContent = this.value;
}
slider2.oninput =function(){
    value2.textContent = this.value;
}
slider3.oninput =function(){
    value3.textContent = this.value;
}
slider4.oninput =function(){
    value4.textContent = this.value;
}
slider5.oninput =function(){
    value5.textContent = this.value;
}
slider6.oninput =function(){
    value6.textContent = this.value;
}
slider7.oninput =function(){
    value7.textContent = this.value;
}
slider8.oninput =function(){
    value8.textContent = this.value;
}

function openPdf(){
    window.open('../pdf/bid1.pdf','_blank')
}