<?php phpinfo(); exit(0);

$dbport = 3306;
$dbhost = 'mariadb';
$dbuser = 'user';
$dbpass = 'pass';
$dbname = 'db';

$stmt = "mysql:host={$dbhost};port={$dbport};dbname={$dbname}";
$params = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8');
$dbh = new PDO($stmt, $dbuser, $dbpass, $params);

if ($dbh) {
    $test_query = "SHOW TABLES FROM {$dbname}";
    $sth = $dbh->prepare($test_query);
    $sth->execute();
    $res = $sth->fetchAll(PDO::FETCH_COLUMN);

    echo "<pre>";
    var_dump($dbh);

    if ($sth->errorCode() !== '0000') {
        echo "Error Code: {$sth->errorCode()}\n";
        echo "Error Info: \n";
        print_r($sth->errorInfo());
    }

    echo "\nTables:\n";
    foreach ($res as & $tableName) {
        echo "- {$tableName}\n";
    }
    // print_r($res);
} else {
    var_dump($dbh->errorInfo());
    //printf("<br>\n%s<br>\n%s", $dbh->errorInfo(), $dbh->errorCode());
    die("Could not open the db '{$dbname}'");
}
