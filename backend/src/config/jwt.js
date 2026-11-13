import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRES_IN = '15m';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Set a long random value in .env'
    );
  }
  return secret;
};

export const assertJwtConfig = () => {
  getSecret();
};

export const signAccessToken = ({ id, role }) =>
  jwt.sign({ sub: String(id), role, tokenType: 'access' }, getSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    issuer: 'sudha-setu',
  });

export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, getSecret(), { issuer: 'sudha-setu', algorithms: ['HS256'] });
  if (payload.tokenType !== 'access' || !payload.sub) throw new Error('Invalid access token');
  return payload;
};
