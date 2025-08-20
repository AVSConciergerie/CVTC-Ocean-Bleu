import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "secret_cestpourtest";

export function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token manquant" });
  
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.admin = payload;
      next();
    } catch {
      res.status(401).json({ error: "Token invalide" });
    }
}
