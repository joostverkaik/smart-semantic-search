var lang = 'nl';
		
$(document).ready(function() {
	var searchTimer;
	var sparqlTimer;
	
	$('#search').keyup(function() {
		clearTimeout(searchTimer);
		
		searchTimer = setTimeout(search, 500);
	});
	
	$('#page-list').on('click', '.page', function() {
		loadPage($(this).attr('data-fb-id'));
	});
	
	$('#sparql').keyup(function() {
		clearTimeout(sparqlTimer);
		
		sparqlTimer = setTimeout(function() {
			sparqlQuery($('#sparql').val());
		}, 500);
	});
	
	$('#lang').change(function() {
		lang = $(this).val();
		
		search();
	});
});

var entityMapping = {
	'DBpedia:Country': 'dbo:country',
	'DBpedia:City': 'dbo:location',
	'DBpedia:Place': 'dbo:isPartOf'
}

var search = function() {
	$.getJSON('http://spotlight.sztaki.hu:2222/rest/annotate', { text: $('#search').val(), confidence: 0.25 }, function(data) {
		
		var location = { property: null, entity: null };
		var subjects = [];
		
		data.Resources.forEach(function(entity) {
			var types = entity['@types'].split(',');
			
			console.log(entity);
			
			var foundType = false;
			
			for(entityType in entityMapping) {
				if(types.indexOf(entityType) > -1) {
					location['property'] = entityMapping[entityType];
					location['entity'] = entity['@URI'];
					
					foundType = true;
					
					break;
				}
			}
			
			if(!foundType) {
				subjects.push(entity['@URI'].replace('resource', 'ontology'));
			}
		});
		
		var query = 'SELECT DISTINCT ?obj ?label ?thumbnail\n';
		
		query += 'WHERE {\n';
		
		if(subjects.length > 1) {
			subjects = subjects.map(function(s) {
				return '\t{ ?obj rdf:type <'+ s +'> . }'
			});
			
			query += subjects.join('\n\t\tUNION\n') +'\n';
		} else {
			query += '\t?obj rdf:type <'+ subjects[0] +'> .\n';
		}
		
		query += '\t?obj '+ location['property'] +' <'+ location['entity'] +'> .\n';
		
		query += '\t?obj rdfs:label ?label .\n';
		
		query += "\tFILTER (lang(?label) = '"+ lang +"') .\n";
		
		query += '\tOPTIONAL { ?obj dbo:thumbnail ?thumbnail }\n';
		
		query += '}\n';
		
		query += 'ORDER BY ?label';
		
		$('#sparql').val(query);
		
		sparqlQuery($('#sparql').val());
		
	})
}

var sparqlQuery = function(q) {
	$.getJSON('http://dbpedia.org/sparql', { query: q }, function(data) {
		$('#page-list').empty();
		$('#page-list').hide();
		
		data.results.bindings.forEach(function(result) {
			
			var li = $('<a />').addClass('entity').attr('target', '_blank').attr('href', result.obj.value);
			// .attr('data-fb-id', entity.id);
			
			//li.append($('<img />').attr('src', 'https://graph.facebook.com/'+ page.id +'/picture?type=large'));
			//li.append($('<strong />').text(result.obj.value));
			
			li.append($('<strong />').text(result.label.value));
			
			if('thumbnail' in result) {
				// console.log(result.thumbnail);
				li.append($('<img />').attr('src', result.thumbnail.value));
			}
			
			$('#page-list').append(li);
		});
		
		$('#page-list').slideDown(200);
	});
}

/*var photoIDs = [];

var loadPage = function(id) {
	$.getJSON('https://graph.facebook.com/'+ id +'/photos/tagged?limit=15&access_token=927270367301083|mhmr1l1pGDlUJTTl7Mu-6A4jQw0', function(data) {
		
		$('#main').empty();
		photoIDs = [];
		
		data.data.forEach(function(photo) {
			if($.inArray(photo.id, photoIDs) == -1) {
				photoIDs.push(photo.id);
				
				$('#main').append($('<img />').attr('src', photo.source));
			}
		});
		
	});
}

var search = function() {
	$.getJSON('https://graph.facebook.com/search?access_token=927270367301083|mhmr1l1pGDlUJTTl7Mu-6A4jQw0&q='+ encodeURIComponent($("#search").val()) +'&limit=8&type=page', function(data) {
		
		if(data.data.length == 0) {
			alert('No pages could be found.');
		} else {
			$('#page-list').empty();
			$('#page-list').hide();
			
			data.data.forEach(function(page) {
				var li = $('<a />').addClass('page').attr('data-fb-id', page.id);
				
				li.append($('<img />').attr('src', 'https://graph.facebook.com/'+ page.id +'/picture?type=large'));
				li.append($('<strong />').text(page.name));
				
				$('#page-list').append(li);
			});
			
			$('#page-list').slideDown(200);
		}
	});
}*/