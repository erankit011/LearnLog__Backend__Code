const express = require('express');
const router = express.Router();
const {
  createJournal,
  getAllJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  getRecentJournals,
} = require('../controllers/journal.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.post('/', verifyJWT, createJournal);
router.get('/recent', verifyJWT, getRecentJournals);
router.get('/', verifyJWT, getAllJournals);
router.get('/:journalId', verifyJWT, getJournalById);
router.patch('/:journalId', verifyJWT, updateJournal);
router.delete('/:journalId', verifyJWT, deleteJournal);

module.exports = router;
