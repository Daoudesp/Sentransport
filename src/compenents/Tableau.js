// Vue qu'on a pas exporte par defaut la function Test(), on le met entre les accolades
import User , {Test} from './User'

function Tableau({titre}) {
    const utilisateurs = [
    {id : 1, nom : "CISSE", prenom : "Daouda"},
    {id : 2, nom : "BA", prenom : "Abdallah"},
  ]
    return(
        <div>
            <Test />
            <h1>Tableau {titre}</h1>
            {
                /**'.map' permet de parcourir les elements
                 * 
                 */
                utilisateurs.map(({id, nom, prenom}, index) => (<User key={id} id={id} nom={nom} prenom={prenom}/>))
            }

        </div>
    )
}

export default Tableau;