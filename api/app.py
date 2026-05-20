import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Charger les donnees depuis le fichier JSON
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "lignes_ddd.json"

with open(DATA_FILE, "r", encoding="utf-8") as f:
    lignes = json.load(f)

# --- Route de base ---
@app.route("/")
def accueil():
    return jsonify({
        "message": "Bienvenue sur l'API SenTransport !",
        "endpoints": ["/lignes", "/lignes/<id>", "/arrets", "/stats", "/lignes/recherche?q=..."]
    })

@app.route("/lignes")
def get_lignes():
    return jsonify(lignes)

@app.route("/lignes/<int:ligne_id>")
def get_ligne(ligne_id):
    ligne = next(
        (l for l in lignes if l["id"] == ligne_id),
        None
    )
    if ligne is None:
        return jsonify({"erreur": "Ligne non trouvee"}), 404
    return jsonify(ligne)

# --- Exercice 1 : GET /arrets ---
# Retourne tous les arrets sans doublons
@app.route("/arrets")
def get_arrets():
    tous_les_arrets = []
    for ligne in lignes:
        tous_les_arrets.extend(ligne["listeArrets"])
    arrets_uniques = list(set(tous_les_arrets))
    return jsonify(arrets_uniques)

# --- Exercice 2 : GET /stats ---
# Retourne statistiques : nb lignes, total arrets, ligne avec le plus d'arrets
@app.route("/stats")
def get_stats():
    nombre_lignes = len(lignes)
    total_arrets = sum(l["arrets"] for l in lignes)
    ligne_max = max(lignes, key=lambda l: l["arrets"])
    return jsonify({
        "nombre_total_lignes": nombre_lignes,
        "nombre_total_arrets": total_arrets,
        "ligne_plus_darrets": {
            "numero": ligne_max["numero"],
            "depart": ligne_max["depart"],
            "arrivee": ligne_max["arrivee"],
            "arrets": ligne_max["arrets"]
        }
    })

# --- Exercice 3 : GET /lignes/recherche?q=Pikine ---
# Filtre les lignes dont le depart ou l'arrivee contient q
@app.route("/lignes/recherche")
def recherche_lignes():
    q = request.args.get("q", "").lower()
    resultats = [
        l for l in lignes
        if q in l["depart"].lower() or q in l["arrivee"].lower()
    ]
    return jsonify(resultats)

if __name__ == "__main__":
    app.run(debug=True, port=5001)