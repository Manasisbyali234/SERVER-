const express = require('express');
const router = express.Router();
const {
    getNewspapers,
    getNewspaperById,
    incrementViewCount,
    getKarnatakaNews,
} = require('../controllers/newspaperController');

router.get('/newspapers', getNewspapers);
router.get('/external-news', getKarnatakaNews);
router.get('/newspaper/:id', getNewspaperById);
router.get('/newspaper/:id/view', incrementViewCount);

module.exports = router;
