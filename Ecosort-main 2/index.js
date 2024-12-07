// Wait for the document to load before executing JavaScript
document.addEventListener("DOMContentLoaded", function() {
  // Function to navigate to another page after 10 seconds
  setTimeout(function() {
    window.location.replace("dashboard.html");
  }, 7000); // 10000 milliseconds = 10 seconds
});

