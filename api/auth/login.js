module.exports = (req, h) => {
  return { token: req.payload.access_token }
}
