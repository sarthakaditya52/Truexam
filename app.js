const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Add Static files
app.use(express.static(path.join(__dirname, 'static')));

//Routes
app.use('/', require('./routes/api/index'));
app.use('/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
}); 