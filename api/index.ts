import dotenv from 'dotenv';

dotenv.config();

import app from '../src/app';
import { assertConfig } from '../src/config/config';
import { initFirebase } from '../src/config/firebase';

assertConfig();
initFirebase();

export default app;
