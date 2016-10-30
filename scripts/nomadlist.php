<?php
require 'vendor/autoload.php';

EasyRdf_Namespace::set('nl', 'http://nomadlist.com/');
EasyRdf_Namespace::set('owl', 'http://www.w3.org/2002/07/owl#');
EasyRdf_Namespace::set('dbr', 'http://dbpedia.org/resource/');
EasyRdf_Namespace::set('dbo', 'http://dbpedia.org/ontology/');

$graph = new EasyRdf_Graph();

$city = $graph->resource('nl:City', 'rdfs:Class');
$country = $graph->resource('nl:Country', 'rdfs:Class');
$region = $graph->resource('nl:Region', 'rdfs:Class');

function addProperties($obj, $key, $sub) {
	if(is_object($sub)) {
		foreach($sub as $subKey => $subObj) {
			addProperties($obj, $key .'_'. $subKey, $subObj);
		}
	} else {
		if(!is_array($sub)) {
			if(strpos($sub, '.jpg') > -1) {
				$sub = 'https://nomadlist.com'. $sub;
			}
			
			$obj->set('nl:'. $key, $sub);
		} else {
			foreach($sub as $subV) {
				$obj->add('nl:'. $key, $subV);
			}
		}
	}
}

function createObject(&$graph, $type, $name, $c) {
	$name = str_replace(' ', '_', $name);
	
	$object = $graph->resource('nl:'. $name, $type);
	
	//if(isset($c->info)) {
	foreach(array('info', 'scores', 'media', 'cost') as $cat) {
		
		foreach($c->{$cat} as $key => $obj) {
			if(in_array($key, array('country', 'region'))) {
				$typeMap = array('city' => 'nl:City', 'country' => 'nl:Country', 'region' => 'nl:Region');
				
				$sub = createObject($graph, $typeMap[$key], $obj->name, $obj);
				
				$object->set('nl:'. $key, $sub);
			} else {
				
				if($cat == 'scores') {
					$key = 'scores_'. $key;
				}
				
				if($cat == 'cost') {
					$key = 'cost_'. $key;
				}
				
				if($key == 'city') {
					$key = 'nomad';	
				}
				
				addProperties($object, $key, $obj);
				
			}
		}
		
	}
	
	addProperties($object, 'tags', $c->tags);
	
	//}
	
	$dbrEquivalent = $graph->resource('dbr:'. $name);
	$object->set('owl:sameAs', $dbrEquivalent);
	
	return $object;
}

$typeMap = array('cities' => 'nl:City', 'countries' => 'nl:Country');

$data = json_decode(file_get_contents('https://nomadlist.com/api/v2/list/cities'));
foreach($data->result as $c) {
	createObject($graph, $typeMap[$data->type], $c->info->city->name, $c);
}

$format = EasyRdf_Format::getFormat('turtle');

$data = $graph->serialise($format);

header('Content-Type: text/turtle');
echo $data;
