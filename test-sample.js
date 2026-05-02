// Sample JavaScript code with intentional bugs for testing

function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {  // Bug: off-by-one error
    total += items[i];
  }
  return total;
}

function getUserData(userId) {
  const user = database.getUser(userId);  // Bug: database not defined
  return user.name;  // Bug: potential null reference
}

function processPayment(amount) {
  if (amount > 0) {
    // Bug: missing return statement
    console.log("Processing payment");
  }
}

async function fetchData(url) {
  const response = await fetch(url);  // Bug: no error handling
  return response.json();
}

function divideNumbers(a, b) {
  return a / b;  // Bug: no check for division by zero
}

// Bug: infinite loop
function countDown(n) {
  while (n > 0) {
    console.log(n);
    // Missing n--
  }
}

// Bug: SQL injection vulnerability
function searchUsers(searchTerm) {
  const query = "SELECT * FROM users WHERE name = '" + searchTerm + "'";
  return executeQuery(query);
}

// Bug: memory leak - event listener not removed
function setupButton() {
  const button = document.getElementById('myButton');
  button.addEventListener('click', function() {
    console.log('Clicked');
  });
}

module.exports = {
  calculateTotal,
  getUserData,
  processPayment,
  fetchData,
  divideNumbers,
  countDown,
  searchUsers,
  setupButton
};

// Made with Bob
