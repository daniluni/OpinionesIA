# OpinionesIA — Plataforma de Opiniones Anónimas con Análisis IA

Plataforma para que empleados opinen anónimamente. Motor de análisis en JS puro
que identifica ideas valiosas, pondera opiniones minoritarias y evita el sesgo
de mayoría. Aplicable a brainstorming, retrospectivas y evaluaciones.

## Estructura

```
OpinionesIA/
  plan.md
  index.html
  css/   reset.css · variables.css · layout.css · components.css · responsive.css
  js/    utils.js · store.js · models.js · charts.js
         ai-engine.js   — Motor IA: clustering TF-IDF, novelty, sentimiento, scoring
         dashboard.js   — Panel global
         sesiones.js    — CRUD sesiones + participación anónima + análisis por sesión
         analisis.js    — Análisis IA profundo multi-sesión
         app.js         — Orquestación
```

## Modelo de datos

**Sesión**: id, titulo, descripcion, tipo (brainstorming/retrospectiva/evaluacion), tema, estado (activa/cerrada), fechaCreacion
**Idea**: id, idSesion, contenido (texto anónimo), fechaCreacion, ai_valor (0-100), ai_novedad (0-100), ai_sentimiento (-1 a 1), ai_cluster, ai_esMinoritaria

## Algoritmos IA (ai-engine.js)

Tokenización + stopwords español + TF-IDF + cosine similarity para clustering.
Score de novedad por rareza del cluster. Diccionario de sentimiento español.
Score compuesto: Novedad×0.35 + |Sentimiento|×0.15 + Relevancia×0.2 + Boost Minoría×0.3.
Insights generados: temas principales, top 5, voces minoritarias, recomendaciones.

## Vistas (3 tabs)

- **📊 Dashboard**: Cards (sesiones, ideas, activas, participación) + dona por tipo + barras ideas/sesión + resumen IA global
- **💡 Sesiones**: CRUD sesiones + al seleccionar: aportar idea (anónimo) + lista ideas con badges IA + análisis de sesión con clústeres y minorías
- **🧠 Análisis IA**: Clústeres globales visualizados, ranking unificado, spotlight voces minoritarias, distribución sentimiento, recomendaciones filtrable por sesión

## Presets

3 sesiones (Lluvia Ideas Procesos, Retro Sprint Q2, Evaluación Clima Laboral)
17 ideas con mezcla de clusters y sentimientos
