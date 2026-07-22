import dotenv from 'dotenv';

dotenv.config();

import app from '../src/app';
import { assertConfig } from '../src/config/config';

assertConfig();

export default app;
