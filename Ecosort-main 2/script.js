import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"

const firebaseConfig = {
  apiKey: "AIzaSyBrIP1FjW9zdw5KPwTquRipUMEZYBWfKeA",
  authDomain: "gnade-a66f0.firebaseapp.com",
  databaseURL: "https://gnade-a66f0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gnade-a66f0",
  storageBucket: "gnade-a66f0.firebasestorage.app",
  messagingSenderId: "735901227798",
  appId: "1:735901227798:web:7dce61c9926e76f4420e37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// Waste Classification and Green Points

// Global Data for Countries (Mocked Data)
let countryWasteData = {};

if (window.location.pathname.includes('leaderboard.html')) {
  setTimeout(async () => {
    getData();
  }, 1);
}

function getData() {
  const reference = ref(db, 'EcoSort/Countries');
  onValue(reference, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(data);
        sortData(data);
      }
    },
    (error) => {
      showToast('Error fetching data: ' + error.message + ' Please try reload the page again with active internet connection');
    });
}

function sortData(data) {
  // Tab to edit
  for (const country in data) {
    const kg = data[country].kg;
    const name = data[country].name;
    countryWasteData[name] = kg;
  }

  renderCountryChart();
}

// Render Bar Chart for Country Leaderboard
function renderCountryChart() {
  const ctx = document.getElementById('countryChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(countryWasteData),
      datasets: [{
        label: 'Waste Sorted (kg)',
        data: Object.values(countryWasteData),
        backgroundColor: [
                    '#66bb6a', '#4caf50', '#388e3c', '#81c784', '#2e7d32', '#1b5e20'
                ],
        borderWidth: 1,
        borderColor: '#2e7d32',
            }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Waste Sorted (kg)',
            color: '#388e3c',
            font: { size: 14, weight: 'bold' }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

if (window.location.pathname.includes('dashboard.html')) {
  document.getElementById('greenPoints').textContent = localStorage.getItem('point') || 0;
  document.getElementById('divertedWaste').textContent = parseFloat(localStorage.getItem('kg')).toFixed(2) || 0;
}

// Image Preview Function
function previewImage(event) {
  const preview = document.getElementById('preview');
  preview.src = URL.createObjectURL(event.target.files[0]);
  preview.style.display = 'block';
  preview.onload = () => URL.revokeObjectURL(preview.src);

  encodeImage();
}

let base64Image = null;

function encodeImage() {
  const input = document.querySelector('.file-input');
  const file = input.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onloadend = function() {
      // The result will be the Base64 encoded string of the image
      base64Image = reader.result.split(',')[1]; // Remove the data:image part
    };

    // Read the image as a Data URL (Base64)
    reader.readAsDataURL(file);
  } else {
    console.log('No file selected');
  }
}

function proceed() {
  if (base64Image !== null && base64Image !== '' && base64Image !== 'null') {
    localStorage.setItem('img', base64Image);
    window.location.href = `result.html`;
    removeImage();
  } else {
    showToast('Image or photo is required!')
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.className = "show";
  toast.innerText = message;
  setTimeout(function() {
    toast.className = toast.className.replace("show", "");
  }, 5000);
}

function removeImage() {
  const fileInput = document.querySelector(".file-input");
  const preview = document.getElementById("preview");

  // Clear the file input
  fileInput.value = "";

  // Hide the preview image
  preview.src = "";
  preview.style.display = "none";
}

if (window.location.pathname.includes('upload.html')) {
  document.querySelector('.file-input').addEventListener('change', function(event) {
    previewImage(event);
  });
  
  document.querySelector('.btn').addEventListener('click', function(){
    proceed();
  });
}