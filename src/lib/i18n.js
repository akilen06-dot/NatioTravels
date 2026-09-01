import { useStore } from './store'

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
]

// A demo-scale translation table: covers navigation and the Settings area so
// switching languages is visibly convincing without hand-translating every
// string in the app. Missing keys fall back to the English source string.
const dict = {
  Discover: { es: 'Descubrir', fr: 'Découvrir', pt: 'Descobrir', de: 'Entdecken', ja: '発見' },
  Search: { es: 'Buscar', fr: 'Rechercher', pt: 'Pesquisar', de: 'Suchen', ja: '検索' },
  Groups: { es: 'Grupos', fr: 'Groupes', pt: 'Grupos', de: 'Gruppen', ja: 'グループ' },
  Messages: { es: 'Mensajes', fr: 'Messages', pt: 'Mensagens', de: 'Nachrichten', ja: 'メッセージ' },
  Profile: { es: 'Perfil', fr: 'Profil', pt: 'Perfil', de: 'Profil', ja: 'プロフィール' },
  'View profile': { es: 'Ver perfil', fr: 'Voir le profil', pt: 'Ver perfil', de: 'Profil ansehen', ja: 'プロフィールを見る' },
  Settings: { es: 'Configuración', fr: 'Paramètres', pt: 'Configurações', de: 'Einstellungen', ja: '設定' },
  Account: { es: 'Cuenta', fr: 'Compte', pt: 'Conta', de: 'Konto', ja: 'アカウント' },
  'Change password': { es: 'Cambiar contraseña', fr: 'Changer le mot de passe', pt: 'Alterar senha', de: 'Passwort ändern', ja: 'パスワードを変更' },
  'Ad preferences': { es: 'Preferencias de anuncios', fr: 'Préférences publicitaires', pt: 'Preferências de anúncios', de: 'Anzeigeneinstellungen', ja: '広告設定' },
  Billing: { es: 'Facturación', fr: 'Facturation', pt: 'Faturamento', de: 'Abrechnung', ja: '請求' },
  Archive: { es: 'Archivo', fr: 'Archive', pt: 'Arquivo', de: 'Archiv', ja: 'アーカイブ' },
  Notifications: { es: 'Notificaciones', fr: 'Notifications', pt: 'Notificações', de: 'Benachrichtigungen', ja: '通知' },
  'Account privacy': { es: 'Privacidad de la cuenta', fr: 'Confidentialité du compte', pt: 'Privacidade da conta', de: 'Kontoprivatsphäre', ja: 'アカウントのプライバシー' },
  'Blocked & reported': { es: 'Bloqueados y reportados', fr: 'Bloqués et signalés', pt: 'Bloqueados e denunciados', de: 'Blockiert & gemeldet', ja: 'ブロックと報告' },
  'Device permissions': { es: 'Permisos del dispositivo', fr: 'Autorisations de l’appareil', pt: 'Permissões do dispositivo', de: 'Geräteberechtigungen', ja: 'デバイスの権限' },
  Language: { es: 'Idioma', fr: 'Langue', pt: 'Idioma', de: 'Sprache', ja: '言語' },
  Plan: { es: 'Plan', fr: 'Forfait', pt: 'Plano', de: 'Tarif', ja: 'プラン' },
  'Safety & privacy': { es: 'Seguridad y privacidad', fr: 'Sécurité et confidentialité', pt: 'Segurança e privacidade', de: 'Sicherheit & Datenschutz', ja: '安全とプライバシー' },
  'Sign out': { es: 'Cerrar sesión', fr: 'Se déconnecter', pt: 'Sair', de: 'Abmelden', ja: 'ログアウト' },
  Save: { es: 'Guardar', fr: 'Enregistrer', pt: 'Salvar', de: 'Speichern', ja: '保存' },
  Cancel: { es: 'Cancelar', fr: 'Annuler', pt: 'Cancelar', de: 'Abbrechen', ja: 'キャンセル' },
  Back: { es: 'Atrás', fr: 'Retour', pt: 'Voltar', de: 'Zurück', ja: '戻る' },
}

export function translate(text, language) {
  if (!language || language === 'en') return text
  return dict[text]?.[language] ?? text
}

export function useT() {
  const language = useStore((s) => s.currentUser?.language)
  return (text) => translate(text, language)
}
