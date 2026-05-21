import { Router } from 'express';
import { DevController } from '../controllers/dev.controller';

const router = Router();
const devController = new DevController();

router.get('/diagnostics', devController.getDiagnostics);
router.post('/repair', devController.repairDatabase);
router.post('/update-company', devController.updateCompany);

export default router;
