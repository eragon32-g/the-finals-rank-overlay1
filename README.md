# RankTag V90

Hard fix sincronizzazione Layout Editor → Generator → Link finale.

## Cosa cambia
- Il JSON esportato dal Layout Editor include chiaramente X/Y/W/H/Font/Z
- Il generator inserisce il JSON completo nel parametro `layout`
- L'overlay finale legge `layout` e lo applica sopra ogni default
- Anteprima live e link stream devono combaciare
- Il default non viene toccato
