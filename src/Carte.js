import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const OMBRE_MARQUEUR =
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

const iconeDefaut = new L.Icon({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: OMBRE_MARQUEUR,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconeUtilisateur = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: OMBRE_MARQUEUR,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconeArretProche = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: OMBRE_MARQUEUR,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function BoutonCentrerPosition({ position }) {
  const map = useMap();

  function centrer() {
    if (position) {
      map.setView(position, 14);
    }
  }

  return (
    <div className="leaflet-top leaflet-right carte-bouton-centrer">
      <button
        type="button"
        className="btn-centrer-position"
        onClick={centrer}
        disabled={!position}
      >
        Centrer sur ma position
      </button>
    </div>
  );
}

function Carte() {
  const [arrets, setArrets] = useState([]);
  const [positionUtilisateur, setPositionUtilisateur] = useState(null);
  const [arretsProches, setArretsProches] = useState([]);
  const [statutGeo, setStatutGeo] = useState('chargement');
  const DAKAR = [14.6928, -17.4467];

  const idArretLePlusProche = arretsProches[0]?.id;

  useEffect(() => {
    fetch('http://127.0.0.1:5001/arrets')
      .then((r) => r.json())
      .then((data) => setArrets(data))
      .catch((err) => console.error('Erreur arrets :', err));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatutGeo('non_supportee');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPositionUtilisateur([pos.coords.latitude, pos.coords.longitude]);
        setStatutGeo('ok');
      },
      (err) => {
        setStatutGeo(err.code === 1 ? 'refusee' : 'erreur');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!positionUtilisateur || arrets.length === 0) {
      setArretsProches([]);
      return;
    }

    const tries = arrets
      .map((a) => ({
        ...a,
        distance: calculerDistance(
          positionUtilisateur[0],
          positionUtilisateur[1],
          a.lat,
          a.lon
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    setArretsProches(tries);
  }, [positionUtilisateur, arrets]);

  return (
    <div className="carte-container">
      <h2 className="carte-titre">Carte des arrets</h2>

      {statutGeo === 'chargement' && (
        <p className="geo-info">Demande d&apos;acces a votre position...</p>
      )}
      {statutGeo === 'refusee' && (
        <p className="geo-avertissement">
          Geolocalisation refusee. Autorisez la position pour ce site, puis
          rechargez la page.
        </p>
      )}
      {statutGeo === 'erreur' && (
        <p className="geo-avertissement">
          Position indisponible. Verifiez que la localisation est activee, puis
          rechargez la page.
        </p>
      )}
      {statutGeo === 'non_supportee' && (
        <p className="geo-avertissement">
          Votre navigateur ne supporte pas la geolocalisation.
        </p>
      )}

      {arretsProches.length > 0 && (
        <ol className="arrets-proches-liste">
          {arretsProches.map((a, index) => (
            <li key={a.id} className={index === 0 ? 'arret-plus-proche' : ''}>
              <span className="arret-rang">{index + 1}.</span>
              <strong>{a.nom}</strong>
              <span className="arret-distance"> ({a.distance.toFixed(1)} km)</span>
            </li>
          ))}
        </ol>
      )}

      <MapContainer center={DAKAR} zoom={13} className="carte">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <BoutonCentrerPosition position={positionUtilisateur} />
        {arrets.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat, a.lon]}
            icon={
              idArretLePlusProche && a.id === idArretLePlusProche
                ? iconeArretProche
                : iconeDefaut
            }
          >
            <Popup>
              <strong>{a.nom}</strong>
              <br />
              Lignes : {a.lignes.join(', ')}
              {a.id === idArretLePlusProche && (
                <>
                  <br />
                  <em>Arret le plus proche</em>
                </>
              )}
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
