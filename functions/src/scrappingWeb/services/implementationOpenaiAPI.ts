import axios from "axios";
import {logger} from "../../utils/logger";

const apiKey =
  "";
/**
 * Envía un fragmento de HTML a OpenAI para obtener una respuesta procesada en formato JSON.
 * @param {string} url - La URL que se está procesando.
 * @param {"summary" | "detailed"} type - Tipo de procesamiento ("summary" o "detailed").
 * @return {Promise<object[] | null>} Respuesta procesada en formato JSON o `null` si ocurre un error.
 */
export async function
getOpenaiResponse(url: string, type: "summary" | "detailed" = "summary"):Promise<object[] | null> {
  const scrapedContent = url;
  if (!scrapedContent) {
    console.log(`No se pudo obtener contenido válido para la URL: ${url}.`);
    return null;
  }

  const systemPrompt =
    `Con base al fragmento de HTML ${url} de las noticias de una pagina, tu objetivo es analizar el HTML y debes retornar la respuesta 
          en formato JSON sin complementos ni información innecesaria mostrando todas las noticias que haya en el html ${url}, no debes 
          agregar nada antes ni después del JSON; el JSON debe tener la siguiente estructura, algo que debes tener en cuenta es que en el campo description debes dar una descripcion 
          detallada de lo sucedido algo largo pero no excesivamente largo, ademas si el city es Bogota añadiras un nuevo campo
          llamado locality diciendo en que localidad sucedio, si no es en bogota no es necesario mostrarlo y en date debes colocar
          la fecha de la noticia publicada:
          [
            { 
              "date": "2024-11-13",
              "hour": "12:30",    
              "city": "Medellín",
              "department": "Antioquia",
              "title": "Noticia 1", 
              "description": "Descripción de la noticia 1",
              "category": "Factores Socioeconómicos",
              "subcategory": "Programas de Paz",
              "infrastructure": "Educación",
              "estado": "futuro"
            }
          ]
          Ten en cuenta que para category, subcategory, infraestructure, segun la noticia debes limitarte a seleccionar uno de
            las opciones presentes, segun sea el caso:

            "category": "Condiciones Meteorológicas y Desastres Naturales", "Crimen Organizado", "Factores Socioeconómicos",
                        "Infraestructura", "Novedad vial", "Orden Público y Seguridad", "Problemas Políticos", "Salud Pública"

            "infrastructure": "Hidráulica", "Telecomunicaciones", "Industrial y Comercial", "Energética", "Residencial",
                                "Transporte terrestre", "Transporte aéreo", "Salud", "Recursos naturales", "Educación"
    
            "subcategory": "Alertas Climáticas Extremas", "Deslizamientos de Tierra", "Incendios", "Terremotos o Tsunamis",
                            "Tormentas, Huracanes o Inundaciones", "Actividades del Narcotráfico", "Extorsiones y Amenazas",
                            "Tráfico de Armas", "Crisis Económicas", "Cortes de Energía", "Daños a Redes de Gas o Agua",
                            "Fallos en Telecomunicaciones", "Cierre vial", "Disturbios Civiles o Paros", "Homicidios",
                            "Protestas y Manifestaciones", "Robos y hurtos", "Secuestros y Extorsión", "Terrorismo",
                            "Brotes de Enfermedades", "Pandemias o Epidemias", "Problemas Sanitarios Graves",
                            "Cambios de Gobierno o Tensiones Políticas", "Reformas Legislativas", "Regulaciones Locales Adversas"
                         }`;
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: systemPrompt,
    },
  ];
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
        temperature: 0.0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    const rawResult = response.data.choices[0].message.content;
    return rawResult ? JSON.parse(rawResult) : null;
  } catch (error) {
    logger.error("Error al obtener la respuesta de OpenAI:", error);
    return null;
  }
}

