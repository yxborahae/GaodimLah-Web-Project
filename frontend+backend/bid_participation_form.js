document.getElementById('proceed-transfer').addEventListener('click', function () {
  alert('Transfer process initiated!');

  const isSuccess = Math.random() > 0.5; 

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

  
  document.getElementById('bid-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Form submitted successfully!');
  });

  

