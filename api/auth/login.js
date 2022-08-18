module.exports = (req, h) => {
  return { token: req.body.access_token }
}
