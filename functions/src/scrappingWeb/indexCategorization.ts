import {getOpenaiResponse} from "./services/implementationOpenaiAPI";
import {filterRecentArticles, processNewsLinks} from "./services/helpers";

import {onDocumentCreated} from "firebase-functions/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();

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
    logger.info("Iniciando categorización para la URL:", data.url);

    const result = await getOpenaiResponse(data.url);
    if (result) {
      const recentArticles = filterRecentArticles(result);
      const detailedInfo = await processNewsLinks(recentArticles);
      detailedResults.push(...detailedInfo);

      logger.info("Resultados detallados procesados:", detailedResults);
    } else {
      logger.warn("No se obtuvo respuesta de OpenAI para la URL:", data.url);
      return;
    }

    if (detailedResults.length > 0) {
      const detailedCollection = db.collection("categorizationResults");
      const batch = db.batch();

      detailedResults.forEach((detailedResult) => {
        const detailedDoc = detailedCollection.doc();
        batch.set(detailedDoc, {
          ...detailedResult,
        });
      });

      await batch.commit();
      logger.info("Resultados detallados guardados en Firestore.");
    }

    logger.info("Categorización completada para la URL:", data.url);
  } catch (error) {
    logger.error("Error en el Trigger de categorización:", error);
  }
});
