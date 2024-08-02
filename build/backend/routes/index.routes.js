const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
      res.render('index');
  } catch (err) {
      console.error('Error rendering about page:', err);
      req.flash('error', 'Unable to load home page. Please try again.');
      res.redirect('/');
  }
});

module.exports = router;