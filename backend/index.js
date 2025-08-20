import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import usersRoutes from './routes/users.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});