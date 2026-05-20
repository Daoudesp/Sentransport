import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';

// Fix icônes Leaflet (bug webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Formule de Haversine — distance en km
function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

const iconeUtilisateur = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function CentrerSurPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 14);
    }
  }, [map, position]);
  return null;
}

function Carte() {
    const [arrets, setArrets] = useState([]);
    const [positionUtilisateur, setPositionUtilisateur] = useState(null);
    const [arretProche, setArretProche] = useState(null);
    const [statutGeo, setStatutGeo] = useState('chargement');
    const DAKAR = [14.6928, -17.4467];
  
    // useEffect 1 : charger les arrêts depuis Flask
    useEffect(() => {
      fetch("http://127.0.0.1:5001/arrets")
        .then(r => r.json())
        .then(data => setArrets(data))
        .catch(err => console.error("Erreur arrets :", err));
    }, []);
  
    // useEffect 2 : géolocalisation
    useEffect(() => {
      if (!navigator.geolocation) {
        setStatutGeo('non_supportee');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          setPositionUtilisateur([
            pos.coords.latitude,
            pos.coords.longitude,
          ]);
          setStatutGeo('ok');
        },
        err => {
          setStatutGeo(err.code === 1 ? 'refusee' : 'erreur');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }, []);
  
    // useEffect 3 : trouver l'arrêt le plus proche
    useEffect(() => {
      if (positionUtilisateur && arrets.length > 0) {
        let proche = null;
        let dMin = Infinity;
        arrets.forEach(a => {
          const d = calculerDistance(
            positionUtilisateur[0],
            positionUtilisateur[1],
            a.lat, a.lon
          );
          if (d < dMin) { dMin = d; proche = { ...a, distance: d }; }
        });
        setArretProche(proche);
      }
    }, [positionUtilisateur, arrets]);
  
    return (
      <div className="carte-container">
        <h2 className="carte-titre">Carte des arrets</h2>
        {statutGeo === 'chargement' && (
          <p className="geo-info">Demande d&apos;acces a votre position...</p>
        )}
        {statutGeo === 'refusee' && (
          <p className="geo-avertissement">
            Geolocalisation refusee. Autorisez la position pour ce site
            (icone cadenas ou i dans la barre d&apos;adresse), puis rechargez la page.
          </p>
        )}
        {statutGeo === 'erreur' && (
          <p className="geo-avertissement">
            Position indisponible. Verifiez que la localisation est activee
            sur votre appareil, puis rechargez la page.
          </p>
        )}
        {statutGeo === 'non_supportee' && (
          <p className="geo-avertissement">Votre navigateur ne supporte pas la geolocalisation.</p>
        )}
        {arretProche && (
          <p className="arret-proche">
            Arret le plus proche :{" "}
            <strong>{arretProche.nom}</strong>{" "}
            ({arretProche.distance.toFixed(1)} km)
          </p>
        )}
        <MapContainer center={DAKAR} zoom={13} className="carte">
          {positionUtilisateur && <CentrerSurPosition position={positionUtilisateur} />}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {arrets.map(a => (
            <Marker key={a.id} position={[a.lat, a.lon]}>
              <Popup>
                <strong>{a.nom}</strong><br />
                Lignes : {a.lignes.join(", ")}
              </Popup>
            </Marker>
          ))}
          {positionUtilisateur && (
            <Marker position={positionUtilisateur} icon={iconeUtilisateur}>
              <Popup>Vous etes ici</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    );
  }
  
  export default Carte;