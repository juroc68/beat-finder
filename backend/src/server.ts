import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`Beat Finder API server running on port ${config.port}`);
});
