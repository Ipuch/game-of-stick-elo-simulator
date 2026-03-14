// dummy test
const fs = require('fs');
const code = fs.readFileSync('public/js/elo.js', 'utf8') +
    "\n\nconsole.log(updateRatings('1200', '1200', 'left'));";
fs.writeFileSync('test.js', code);
