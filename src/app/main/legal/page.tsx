'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// app/main/legal/page.tsx — Aviso Legal, Termos de Envio de Conteúdo,
// Termos de Serviço, Privacidade, Cookies, Segurança, Contacto,
// Direitos de Autor, Notificação e Remoção, e Contra-Notificação,
// agrupados numa única página com abas (mesmo padrão já usado em
// account/page.tsx). Conteúdo integral sincronizado com o documento
// legal de referência da PixGo.

const TABS = [
  { key: 'notice',  prefix: 'notice',  count: 7,  labelKey: 'legal.tabNotice',  titleKey: 'legal.noticeT' },
  { key: 'upload',  prefix: 'upload',  count: 12, labelKey: 'legal.tabUpload',  titleKey: 'legal.uploadT' },
  { key: 'tos',     prefix: 'tos',     count: 32, labelKey: 'legal.tabTos',     titleKey: 'legal.tosT' },
  { key: 'privacy', prefix: 'priv',    count: 19, labelKey: 'legal.tabPrivacy', titleKey: 'legal.privacyT' },
  { key: 'cookies', prefix: 'cookies', count: 17, labelKey: 'legal.tabCookies', titleKey: 'legal.cookiesT' },
  { key: 'security',prefix: 'sec',     count: 16, labelKey: 'legal.tabSecurity',titleKey: 'legal.securityT' },
  { key: 'contact', prefix: 'contact', count: 6,  labelKey: 'legal.tabContact', titleKey: 'legal.contactT' },
  { key: 'ipr',     prefix: 'ipr',     count: 22, labelKey: 'legal.tabIpr',     titleKey: 'legal.iprT' },
  { key: 'dmca',    prefix: 'dmca',    count: 28, labelKey: 'legal.tabDmca',    titleKey: 'legal.dmcaT' },
  { key: 'counter', prefix: 'counter', count: 26, labelKey: 'legal.tabCounter', titleKey: 'legal.counterT' },
] as const;

type TabKey = typeof TABS[number]['key'];

// Deteta endereços de e-mail dentro do texto e destaca-os, sem
// depender de qualquer parser de markdown — o corpo dos textos legais
// é texto simples com quebras de linha (whiteSpace: 'pre-line').
const EMAIL_SPLIT_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
// Regex separada (sem flag "g") para o teste — reutilizar uma regex global
// em .test() dentro de um map() manteria o lastIndex entre chamadas e
// produziria falsos negativos intermitentes.
const EMAIL_TEST_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function BodyText({ text }: { text: string }) {
  const parts = text.split(EMAIL_SPLIT_RE);
  return (
    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
      {parts.map((part, i) =>
        EMAIL_TEST_RE.test(part) ? (
          <a
            key={i}
            href={`mailto:${part}`}
            style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
}

function Section({ titleKey, bodyKey, t }: { titleKey: string; bodyKey: string; t: (k: string) => string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-title)', marginBottom: 7 }}>
        {t(titleKey)}
      </h3>
      <BodyText text={t(bodyKey)} />
    </div>
  );
}

export default function LegalPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('tos');
  const active = TABS.find(tb => tb.key === tab)!;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 className="page-title">{t('legal.title')}</h1>
      </div>

      <div className="tabs">
        {TABS.map(tb => (
          <button key={tb.key} className={`tab ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, marginBottom: 18 }}>
          {t(active.titleKey)}
        </h2>
        {Array.from({ length: active.count }, (_, i) => i + 1).map(n => (
          <Section
            key={`${active.prefix}${n}`}
            titleKey={`legal.${active.prefix}${n}t`}
            bodyKey={`legal.${active.prefix}${n}`}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
