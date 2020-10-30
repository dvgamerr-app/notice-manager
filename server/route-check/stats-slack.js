module.exports = (req, res) => {
  // Authorization oauth2 URI
  try {
    res.json(req.headers)
  } catch (ex) {
    res.status(500).json({ error: ex.stack || ex.message || ex })
  } finally {
    res.end()
  }
}
