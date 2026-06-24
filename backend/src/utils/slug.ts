export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Transforma caracteres acentuados em caracteres simples
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .toLowerCase() // Tudo para minúsculo
    .trim() // Remove espaços do início e fim
    .replace(/\s+/g, '-') // Troca espaços por hífens
    .replace(/[^\w-]+/g, '') // Remove caracteres não-alfanuméricos
    .replace(/--+/g, '-'); // Troca múltiplos hífens por um único
}
