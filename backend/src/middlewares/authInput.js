export const validateAuthInput = (req, res, next) => {
  for (const field of ['email', 'name', 'password', 'newPassword', 'code', 'abhaId', 'role']) {
    const value = req.body?.[field];
    if (value !== undefined && (typeof value !== 'string' || value.length > 5000)) {
      return res.status(400).json({ message: `${field} must be a string of at most 5000 characters` });
    }
  }
  next();
};
