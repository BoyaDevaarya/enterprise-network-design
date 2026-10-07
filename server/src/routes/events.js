import express from 'express';
import { handleSSEConnection } from '../services/sse.js';

const router = express.Router();

router.get('/', (req, res) => {
  handleSSEConnection(req, res);
});

export default router;
