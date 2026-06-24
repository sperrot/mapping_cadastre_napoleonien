/* Copier ce fichier en `config.js` et renseigner les valeurs Supabase.
 * `config.js` est ignoré par git (voir .gitignore).
 *
 * En V0.0, la carte et la recherche fonctionnent SANS Supabase :
 * laissez les valeurs vides pour une démo « carte seule ». Dès que la
 * table `document` est peuplée, renseignez l'URL + la clé anon (publique,
 * lecture seule via RLS) pour afficher les liens d'archives.
 */
window.CONFIG = {
  SUPABASE_URL: "", // ex. https://xxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: "", // clé "anon public"
};
