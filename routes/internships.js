const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const Counter = require('../models/Counter');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper: fetch og:image from a given link
async function getOGImage(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);
    return $('meta[property="og:image"]').attr('content') || '';
  } catch {
    return '';
  }
}

// POST /add - Add internship
router.post('/add', async (req, res) => {
  try {
    const { title, description, ctc, link, location } = req.body;

    // Auto-increment ID
    const counter = await Counter.findOneAndUpdate(
      { id: 'internship_id' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Fetch og:image
    const image = await getOGImage(link);

    const newIntern = new Internship({
      id: counter.seq,
      title,
      description,
      ctc,
      link,
      location,
      image
    });

    await newIntern.save();
    res.status(201).json(newIntern);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / - All internships
router.get('/', async (req, res) => {
  const internships = await Internship.find().sort({ createdAt: -1 });
  res.json(internships);
});

// GET /:id - Preview + Redirect
router.get('/:id', async (req, res) => {
  try {
    const intern = await Internship.findOne({ id: req.params.id });
    if (!intern) return res.status(404).send('Not found');

    res.send(`
      <html>
        <head>
          <meta property="og:title" content="${intern.title}" />
          <meta property="og:description" content="${intern.description}" />
          <meta property="og:image" content="${intern.image || 'https://yourdomain.com/default.png'}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta http-equiv="refresh" content="3;url=${intern.link}" />
          <title>Redirecting to ${intern.title}</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <h2>Redirecting to ${intern.title}...</h2>
          <p>If not redirected, <a href="${intern.link}">click here</a>.</p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error loading job preview');
  }
});

module.exports = router;
