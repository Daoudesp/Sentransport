import Carte from './Carte';
import {useState} from 'react';
import {useEffect} from 'react';
import './App.css';
import Header from './Header';
import Recherche from './Recherche';
import LigneBus from './LigneBus';
import DetailLigne from './DetailLigne';
import Footer from './Footer';

function App(){
  const [lignes,setLignes]=useState([]);
  const [chargement,setChargement]=useState(true);
  const [erreur,setErreur]=useState(null);
  const [recherche,setRecherche]=useState("");
  const [ligneSelectionnee,setLigneSelectionnee]=useState(null);
  const [nbRecherches,setNbRecherches]=useState(0);

  function chargerLignes(){
    setChargement(true);
    setErreur(null);
    setLigneSelectionnee(null);

    fetch("http://127.0.0.1:5001/lignes")
      .then(response=>{
        if(!response.ok){
          throw new Error("Erreur serveur : "+response.status);
        }
        return response.json();
      })
      .then(data=>{
        setLignes(data);
        setChargement(false);
      })
      .catch(error=>{
        setErreur(error.message);
        setChargement(false);
      });
  }

  useEffect(()=>{
    chargerLignes();
  },[]);

  const lignesFiltrees=lignes.filter(l=>
    l.depart.toLowerCase().includes(recherche.toLowerCase())||
    l.arrivee.toLowerCase().includes(recherche.toLowerCase())||
    l.numero.includes(recherche)
  );

  function handleClickLigne(ligne){
    if(ligneSelectionnee&&ligneSelectionnee.id===ligne.id){
      setLigneSelectionnee(null);
      return;
    }

    fetch(`http://127.0.0.1:5001/lignes/${ligne.id}`)
      .then(response=>{
        if(!response.ok){
          throw new Error("Erreur serveur : "+response.status);
        }
        return response.json();
      })
      .then(data=>{
        setLigneSelectionnee(data);
      })
      .catch(()=>{
        setLigneSelectionnee(null);
      });
  }

  function handleRecherche(valeur){
    setRecherche(valeur);
    setNbRecherches(n=>n+1);
  }

  if(chargement){
    return(
      <div className="App">
        <Header/>
        <main className="contenu">
          <p className="message-chargement">Chargement des lignes...</p>
        </main>
      </div>
    );
  }

  if(erreur){
    return(
      <div className="App">
        <Header/>
        <main className="contenu">
          <div className="message-erreur">
            <p>Impossible de charger les lignes.</p>
            <p className="erreur-detail">{erreur}</p>
            <p>Verifiez que le serveur Flask est lance (python api/app.py).</p>
          </div>
        </main>
      </div>
    );
  }

  return(
    <div className="App">
      <Header/>
      <main className="contenu">
        <p>Vous avez effectue {nbRecherches} recherche(s)</p>
        <Recherche valeur={recherche} onChange={handleRecherche}/>
        <button className="btn-recharger" onClick={chargerLignes}>
          Recharger
        </button>
        {lignesFiltrees.length===0
          ?<p>Aucune ligne trouvee</p>
          :<p className="resultat-recherche">
            {lignesFiltrees.length} ligne{lignesFiltrees.length>1?'s':''} trouvee{lignesFiltrees.length>1?'s':''}
          </p>
        }
        {lignesFiltrees.map(ligne=>(
          <LigneBus
            key={ligne.id}
            numero={ligne.numero}
            depart={ligne.depart}
            arrivee={ligne.arrivee}
            arrets={ligne.arrets}
            estSelectionnee={ligneSelectionnee&&ligneSelectionnee.id===ligne.id}
            onClick={()=>handleClickLigne(ligne)}
          />
        ))}
        {ligneSelectionnee&&<DetailLigne ligne={ligneSelectionnee}/>}
        <Carte />
      </main>
      <Footer/>
    </div>
  );
}

export default App;