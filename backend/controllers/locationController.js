/**
 * Location Controller
 * Handles saved_locations for the student user
 */

const SavedLocation = require('../models/SavedLocation');

// ── GET /api/locations/saved ───────────────────────────────────────
const getSavedLocations = async (req, res) => {
  try {
    const locations = await SavedLocation.getByUserId(req.user.id);
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved locations' });
  }
};

// ── POST /api/locations/saved ──────────────────────────────────────
const addSavedLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    if (!name || !address || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'name, address, latitude, longitude are required' });
    }

    const location = await SavedLocation.create({
      user_id: req.user.id,
      name, address, latitude, longitude,
    });

    res.status(201).json({ message: 'Location saved', location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location' });
  }
};

// ── DELETE /api/locations/saved/:id ───────────────────────────────
const deleteSavedLocation = async (req, res) => {
  try {
    const deleted = await SavedLocation.delete(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Location not found or not yours' });
    }
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

// ── GET /api/locations/defaults ────────────────────────────────────
const getDefaultLocations = (req, res) => {
  res.json({ locations: SavedLocation.getDefaultLocations() });
};

module.exports = {
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getDefaultLocations,
};
