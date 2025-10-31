import { Request, Response, NextFunction } from 'express';
import { getStorage } from '../storage';

export interface DomainRequest extends Request {
  identifiedCompanyId?: string;
  customDomainAccess?: boolean;
}

/**
 * Middleware que identifica a empresa pelo domínio da requisição.
 *
 * Funciona em 3 modos:
 * 1. Custom Domain: domain.com → busca empresa por custom domain
 * 2. Normal: localhost/api/* → usa autenticação JWT tradicional
 * 3. Admin: sempre usa JWT tradicional
 *
 * Este middleware NÃO bloqueia requisições, apenas adiciona contexto.
 * A autenticação JWT continua sendo necessária.
 */
export async function identifyCompanyByDomain(
  req: DomainRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const host = req.hostname;
    const mainDomain = process.env.MAIN_DOMAIN || 'localhost';

    // Log para debug
    console.log(`🌐 [DOMAIN-MIDDLEWARE] Host: ${host}, Main Domain: ${mainDomain}`);

    // Se é o domínio principal, não precisa identificar por custom domain
    if (host === mainDomain || host.includes(mainDomain)) {
      console.log(`✅ [DOMAIN-MIDDLEWARE] Domínio principal detectado, usando autenticação JWT normal`);
      return next();
    }

    // Se é uma rota de API admin, sempre usa JWT normal
    if (req.path.startsWith('/api/admin')) {
      console.log(`✅ [DOMAIN-MIDDLEWARE] Rota admin detectada, usando autenticação JWT normal`);
      return next();
    }

    // Tenta identificar por custom domain
    const storage = getStorage();
    await storage.init();

    // Remove www. do host se existir
    const cleanHost = host.replace(/^www\./, '');

    console.log(`🔍 [DOMAIN-MIDDLEWARE] Buscando custom domain: ${cleanHost}`);

    const customDomain = await storage.getCustomDomainByHost(cleanHost);

    if (customDomain && customDomain.status === 1) {
      // Domínio customizado encontrado e ativo
      req.identifiedCompanyId = customDomain.companyId;
      req.customDomainAccess = true;

      console.log(`✅ [DOMAIN-MIDDLEWARE] Empresa identificada por custom domain:`, {
        domain: cleanHost,
        companyId: customDomain.companyId
      });

      // Adiciona header personalizado para o frontend saber que está em custom domain
      res.setHeader('X-Custom-Domain', cleanHost);
      res.setHeader('X-Company-Id', customDomain.companyId);
    } else {
      console.log(`⚠️ [DOMAIN-MIDDLEWARE] Nenhum custom domain ativo encontrado para: ${cleanHost}`);
    }

    next();
  } catch (error) {
    console.error('❌ [DOMAIN-MIDDLEWARE] Erro ao identificar empresa por domínio:', error);
    // Em caso de erro, continua normalmente (fail-safe)
    next();
  }
}

/**
 * Middleware que valida se a empresa identificada pelo domínio
 * corresponde à empresa do usuário autenticado.
 *
 * Use este middleware DEPOIS da autenticação JWT em rotas de cliente.
 */
export function validateCustomDomainAccess(
  req: DomainRequest,
  res: Response,
  next: NextFunction
) {
  // Se não há identificação de domínio customizado, pula a validação
  if (!req.customDomainAccess || !req.identifiedCompanyId) {
    return next();
  }

  // Verifica se o usuário pertence à empresa do domínio
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      error: 'Autenticação necessária para acessar este domínio'
    });
  }

  // Admin pode acessar qualquer domínio
  if (user.role === 'admin') {
    return next();
  }

  // Cliente deve pertencer à empresa do domínio
  if (user.companyId !== req.identifiedCompanyId) {
    return res.status(403).json({
      error: 'Acesso negado: este domínio pertence a outra empresa'
    });
  }

  next();
}
