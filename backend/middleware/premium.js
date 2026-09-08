// Assumes your User model has an `isPremium` boolean field.
// Adjust the field name if your project calls it something else
// (e.g. `plan: 'premium'` or `subscriptionStatus`).
function requirePremium(req, res, next) {
  if (!req.user?.isPremium) {
    return res.status(403).json({ error: "This feature is available to Premium users only." });
  }
  next();
}

module.exports = { requirePremium };
