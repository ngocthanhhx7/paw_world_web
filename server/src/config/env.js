const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: process.env.NODE_ENV !== 'production',
});
