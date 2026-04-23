function User(props) {
    return(
        <div>
            {props.id} - {props.prenom} - {props.nom}
        </div>        
    )
}
export function Test(){
    return "test"
}

// Quand on va recuperer la fonction User(), par defaut
export default User;

/**Par defaut, c'est l'element HTML qui a par defaut "key" */