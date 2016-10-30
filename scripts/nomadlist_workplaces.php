<?php
ini_set('memory_limit', '2048M');
ini_set('max_execution_time', '600');

require 'vendor/autoload.php';

EasyRdf_Namespace::set('nl', 'http://nomadlist.com/');
EasyRdf_Namespace::set('owl', 'http://www.w3.org/2002/07/owl#');
EasyRdf_Namespace::set('dbr', 'http://dbpedia.org/resource/');
EasyRdf_Namespace::set('dbo', 'http://dbpedia.org/ontology/');

$graph = new EasyRdf_Graph();

$workplace	  = $graph->resource('nl:Workplace', 'rdfs:Class');
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
	    if (in_array($key, array('city')) && !empty($obj->name)) {
            $typeMap = array('city' => 'nl:City', 'country' => 'nl:Country');
            
            $sub = createObject($graph, $typeMap[$key], $obj->name, new stdClass());
            
            $object->set('nl:' . $key, $sub);
        } else {
            
            if ($key != 'country' && $key != 'city') {
	            if ($key == 'name') {
		            $key = 'nomad_name';
	            }
	            
	            addProperties($object, $key, $obj);
            }
            
        }
    }
    
    if ($city != null) {
        $cityresource = $graph->resource('nl:'. $city);
        
        $object->set('nl:locatedIn', $cityresource);
        $object->set('nl:city', $cityresource);
    }
    //$dbrEquivalent = $graph->resource('dbr:'. $name);
    //$object->set('owl:sameAs', $dbrEquivalent);
    
    return $object;
}

$files = glob('workplaces/*.json');

foreach (array_slice($files, 0) as $file) {
	$name = explode('.json', $file);
	$name = explode('/', $name[0]);
	$name = $name[1];
	
	echo $name ."\n";
	
    $data = json_decode(file_get_contents($file));
    foreach ($data as $c) {
        createObject($graph, 'nl:Workplace', $c->name, $c, str_replace(' ', '_', $name));
    }
}

$format = EasyRdf_Format::getFormat('turtle');

$data = $graph->serialise($format);

//header('Content-Type: text/turtle; charset=utf-8');
//echo $data;

file_put_contents('ttls/all_workplaces.ttl', $data);