/* Config Supabase versionnée. La clé anon est publique par conception
 * (lecture seule via RLS : policies SELECT pour public sur commune/document,
 * aucune écriture). Voir config.example.js pour le gabarit. */
window.CONFIG = {
  SUPABASE_URL: "https://bbbxovawtpgsvkjfoehn.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnhvdmF3dHBnc3ZramZvZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTM1OTcsImV4cCI6MjA5Nzg2OTU5N30.xtvloJoOFv0zHZGrkLxbbvO3Y5T2A9db41wbnUcWr3c",
};
