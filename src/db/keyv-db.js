import Keyv from 'keyv';
import { MONGODB_URI } from "../constants/env-constants.js";

export const keyv = new Keyv(MONGODB_URI);

