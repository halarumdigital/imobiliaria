-- ============================================
-- MIGRATION OPCIONAL: Adicionar Foreign Keys
-- Execute SOMENTE se quiser adicionar as constraints de integridade referencial
-- Se der erro, não tem problema - o sistema funciona sem elas
-- ============================================

-- IMPORTANTE: Antes de executar, certifique-se que:
-- 1. A tabela 'companies' existe
-- 2. O campo 'id' em 'companies' é VARCHAR(36)
-- 3. O charset/collation correspondem

-- Adicionar FK em company_custom_domains
ALTER TABLE company_custom_domains
ADD CONSTRAINT fk_company_custom_domains_company
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE CASCADE;

-- Adicionar FK em company_websites
ALTER TABLE company_websites
ADD CONSTRAINT fk_company_websites_company
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE CASCADE;

ALTER TABLE company_websites
ADD CONSTRAINT fk_company_websites_template
  FOREIGN KEY (template_id) REFERENCES website_templates(id);

-- Adicionar FK em company_agents
ALTER TABLE company_agents
ADD CONSTRAINT fk_company_agents_company
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE CASCADE;

-- Adicionar FK em company_testimonials
ALTER TABLE company_testimonials
ADD CONSTRAINT fk_company_testimonials_company
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE CASCADE;

SELECT 'Foreign keys adicionadas com sucesso!' as Status;
