import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {firestorePaths} from "../utils/firestore-paths";
import {onDocumentCreated} from "firebase-functions/firestore";
import {scrapingWeb} from "./services/scrapper";
import {getOpenaiResponse} from "./services/implementationOpenaiAPI";

const db = admin.firestore();
const sources = {
  cityTV: [
    "https://citytv.eltiempo.com/noticias/judicial/",
    "https://citytv.eltiempo.com/noticias/seguridad/",
    "https://citytv.eltiempo.com/noticias/orden-publico/",
  ],
  vanguardia: [
    "https://www.vanguardia.com/judicial/",
    "https://www.vanguardia.com/economia/",
    "https://www.vanguardia.com/colombia/",
  ],
  elColombiano: [
    "https://www.elcolombiano.com/medellin/",
    "https://www.elcolombiano.com/antioquia/",
    "https://www.elcolombiano.com/colombia/",
  ],
  el_pilon: [
    "https://elpilon.com.co/",
  ],
  el_universal: [
    "https://www.eluniversal.com.co/sucesos/",
  ],
  enlace_television: [
    "https://enlacetelevision.com/noticias/",
  ],
  boyaca7_dias: [
    "https://boyaca7dias.com.co/",
  ],
  redmas: [
    "https://redmas.com.co/seccion/colombia/",
    "https://redmas.com.co/judiciales-t59685",
    "https://redmas.com.co/orden-publico-t59597",
  ],
  canal_capital: [
    "https://www.alertabogota.com/",
  ],
  alerta_bogota: [
    "https://www.alertabogota.com/noticias/local",
  ],
  estrategia_medios: [
    "https://extrategiamedios.com/noticias/regionomia/",
  ],
};

/**
 * Función para agregar todas las URLs a Firestore en la colección `urlResults`.
 */
export const urlsPagesNotices = onRequest(
  async (request, response) => {
    try {
      logger.info("Iniciando la función para agregar URLs a Firestore.");

      const batch = db.batch();

      for (const [source, urls] of Object.entries(sources)) {
        urls.forEach((url) => {
          const docRef = db.collection(firestorePaths.urlResultsPath).doc();
          batch.set(docRef, {source, url, key: docRef.id});
        });
      }

      await batch.commit();
      response.status(200).send("Todas las URLs han sido agregadas a Firestore.");
      logger.info("URLs agregadas exitosamente a Firestore.");
    } catch (error) {
      logger.error("Error al agregar las URLs a Firestore:", error);
      response.status(500).send("Error al agregar las URLs a Firestore.");
    }
  });

/**
 * Trigger que ejecuta el scraping al agregar un documento en `urlResults`.
 */
export const scrappingWebTrigger = onDocumentCreated({
  document: "urlResults/{docId}",
},
async (event) => {
  try {
    const newDocument = event.data;
    if (!newDocument) {
      logger.warn("Documento nuevo no encontrado.");
      return;
    }

    const data = newDocument.data();
    logger.info("Nueva URL añadida: Source");
    const cleanHTML = await scrapingWeb(data.url);

    const docRef = db.collection(firestorePaths.scrappingResultsPath).doc();
    await docRef.set({
      source: data.source,
      url: data.url,
      htmlContent: cleanHTML,
      key: docRef.id,
    });
    logger.info("Scraping completado y datos guardados en Firestore.");
  } catch (error) {
    logger.error("Error al reaccionar a la adición de una URL:", error);
  }
}
);

/**
 * Trigger que se activa al crear un documento en scrappingResults.
 * Realiza la categorización de las noticias y guarda los resultados en Firestore.
 * Evento que activa el Trigger.
 */
export const categorizationTrigger = onDocumentCreated({
  document: "scrappingResults/{docId}"},

async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("No hay datos en el evento.");
      return;
    }

    const data = snapshot.data();
    if (!data || !data.url) {
      logger.warn("Documento inválido: Falta la URL.");
      return;
    }
    const detailedResults: object[] = [];
    const result = await getOpenaiResponse(data.htmlContent);
    if (result) {
      detailedResults.push(...result);
      console.log("TAMAÑO DETAIL", result.length);
      const detailedCollection = db.collection("categorizationResults");
      const batch = db.batch();

      detailedResults.forEach((detailedResult) => {
        const detailedDoc = detailedCollection.doc();
        batch.set(detailedDoc, {
          ...detailedResult,
        });
      });
      logger.info("Resultados detallados procesados:", detailedResults);
    } else {
      logger.warn("No se obtuvo respuesta de OpenAI para la URL:", data.url);
      return;
    }

    console.log("RESULTADOS CATEGORIZACION", detailedResults);
    logger.info("Categorización completada para la URL:", data.url);
  } catch (error) {
    logger.error("Error en el Trigger de categorización:", error);
  }
});


