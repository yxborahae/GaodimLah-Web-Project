const tenderID = new URLSearchParams(window.location.search).get('tenderID');

const back = document.getElementById('back-btn');
back.addEventListener('click', function () {
    window.location.href = `evaluate_list.html?tenderID=${tenderID}`;
});

const done = document.getElementById('done-btn');
done.addEventListener('click', function () {
    window.location.href = `evaluate_list.html?tenderID=${tenderID}`;
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


//open pdf
function openPdf(){
    window.open('../pdf/bid1.pdf','_blank')
}