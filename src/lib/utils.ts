export function esImagenValida(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  
  // Excluir la imagen fallback por defecto de Unsplash usada anteriormente en importaciones
  if (trimmed.includes("photo-1531297484001-80022131f5a1")) return false;
  
  // Excluir URLs con términos típicos de placeholder o imagen faltante
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("placeholder") ||
    lower.includes("no-image") ||
    lower.includes("sin-imagen") ||
    lower.includes("default")
  ) {
    return false;
  }
  
  return true;
}
