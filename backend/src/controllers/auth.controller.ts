import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login rápido via PIN numérico.
   * Body: { userId: string, pin: string }
   * Público mas requer que o userId pertença a uma empresa válida.
   */
  loginPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.loginPin(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lists active staff of the AUTHENTICATED user's company.
   * SECURITY: companyId is ALWAYS taken from the JWT token (req.user.companyId).
   * Any companyId provided via query/body is completely ignored.
   */
  listStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only trust the token — never a client-supplied companyId
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ message: 'Sessão inválida.' });
      }
      const result = await this.authService.listStaffForLogin(companyId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
