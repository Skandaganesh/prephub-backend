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
router.post('/addinternshipopening', async (req, res) => {
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
// Serve OG meta for /internship frontend route
router.get('/internship-og', (req, res) => {
    res.send(`
      <html>
        <head>
          <meta property="og:title" content="Internships at PrepHub" />
          <meta property="og:description" content="Explore the latest internship openings on PrepHub!" />
          <meta property="og:image" content="https://prephub.netlify.app/dedicated-magento-developer.png" />
          <meta property="og:url" content="https://prephub.netlify.app/internship" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta http-equiv="refresh" content="0;url=https://prephub.netlify.app/internship" />
          <title>Redirecting to Internships</title>
        </head>
        <body style="text-align:center;font-family:sans-serif;">
          <p>Redirecting to internship listings…</p>
          <a href="https://prephub.netlify.app/internship">Click here</a> if not redirected.
        </body>
      </html>
    `);
  });
  
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
          <meta property="og:image" content="${intern.image || ' https://prephub.netlify.app/dedicated-magento-developer.png'}" />
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
