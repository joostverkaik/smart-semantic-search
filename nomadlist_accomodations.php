<?php
ini_set('memory_limit', '500M');
ini_set('max_execution_time', '600');
require 'vendor/autoload.php';

EasyRdf_Namespace::set('nl', 'http://nomadlist.com/');
EasyRdf_Namespace::set('owl', 'http://www.w3.org/2002/07/owl#');
EasyRdf_Namespace::set('dbr', 'http://dbpedia.org/resource/');
EasyRdf_Namespace::set('dbo', 'http://dbpedia.org/ontology/');

$graph = new EasyRdf_Graph();

$accomodation = $graph->resource('nl:Accomodation', 'rdfs:Class');
$city         = $graph->resource('nl:City', 'rdfs:Class');

function addProperties($obj, $key, $sub)
{
    
    if (is_object($sub)) {
        foreach ($sub as $subKey => $subObj) {
            addProperties($obj, $key . '_' . $subKey, $subObj);
        }
    } else {
        if ( !is_array($sub)) {
            $obj->set('nl:' . $key, $sub);
        } else {
            foreach ($sub as $subV) {
                $obj->add('nl:' . $key, $subV);
            }
        }
    }
}

function createObject(&$graph, $type, $name, $c, $city = null)
{
    
    $name = str_replace(' ', '_', $name);
    
    $object = $graph->resource('nl:' . $name, $type);
    
    foreach ($c as $key => $obj) {
        if (in_array($key, array('city', 'country')) && !empty($obj->name)) {
            $typeMap = array('city' => 'nl:City', 'country' => 'nl:Country');
            
            $sub = createObject($graph, $typeMap[$key], $obj->name, $obj);
            
            $object->set('nl:' . $key, $sub);
        } else {
            
            if ($key == 'city') {
                $key = 'nomad';
            }
            
            addProperties($object, $key, $obj);
            
        }
    }
    
    if ($city != null) {
        $cityresource = $graph->resource('nl:'.$city);
        $object->set('nl:locatedIn', $cityresource);
    }
    //$dbrEquivalent = $graph->resource('dbr:'. $name);
    //$object->set('owl:sameAs', $dbrEquivalent);
    
    return $object;
}

$files = glob('hotels/*.json');
foreach ($files as $file) {
    $data = json_decode(file_get_contents($file));
    foreach ($data as $c) {
        createObject($graph, 'nl:Accomodation', $c->name, $c, 'Amsterdam');
    }
}

$format = EasyRdf_Format::getFormat('turtle');

$data = $graph->serialise($format);

//header('Content-Type: text/turtle');
file_put_contents('hotels.json', $data);
