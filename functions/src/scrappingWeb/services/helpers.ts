import {getOpenaiResponse} from "./implementationOpenaiAPI";

/**
 * Filtra los artículos recientes basándose en las fechas válidas.
 * @param {object[]} articles - Lista de artículos con posibles fechas.
 * @return {object[]} - Artículos que cumplen los criterios de fechas válidas.
 */
export function filterRecentArticles(articles: { date?: string }[]): object[] {
  const [today, yesterday] = getValidDates();

  return articles.filter((article) => {
    if (!article.date || article.date.trim() === "") {
      return true;
    }
    return article.date === today || article.date === yesterday;
  });
}

/**
   * Obtiene las fechas de hoy y ayer en formato "YYYY-MM-DD".
   * @return {string[]} Array con las fechas de hoy y ayer.
   */
function getValidDates(): string[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  return [formatDate(today), formatDate(yesterday)];
}

/**
   * Procesa los enlaces de noticias y obtiene información detallada.
   * @param {Array<{url: string}>} articles - Lista de artículos con enlaces a procesar.
   * @return {Promise<object[]>} Lista de resultados detallados.
   */
export async function

processNewsLinks(articles: any[]) {
  const detailedResults: object[] = [];
  for (const article of articles) {
    const {url} = article;
    console.log("Procesando el link de la noticia:", {url});
    try {
      const detailedInfo = await getOpenaiResponse(url, "detailed");
      if (detailedInfo) {
        detailedResults.push(detailedInfo);
      } else {
        console.warn("No se obtuvo información detallada para la URL:", {url});
      }
    } catch (error) {
      console.error("Error al procesar la URL ${url}:", error);
    }
  }

  return detailedResults;
}

