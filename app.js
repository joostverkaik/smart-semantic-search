var replaceByMap = function(value, map) {
	return value.replace(new RegExp("(" + Object.keys(map).map(function(i){ return i.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&"); }).join("|") + ")", "g"), function(s) { return map[s]; });
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var app = new Vue({
	el: '#app',
	
	data: {
		currentQuery: '',
		queryChangeTimer: null,
		
		currentCities: [],
		
		selectedCity: null,
		currentCity: {
			'sw:name': '',
			
			rawBindings: []	
		},
		
		currentCityLoaded: false,
		
		currentPlaces: [],
		placesType: 'nl:Accommodation',
		
		selectedTag: null,
		selectedMonth: null,
		
		displayProperties: ['nl:weather_type', 'nl:weather_temperature_celsius', 'nl:weather_humidity_value', 'nl:weather_humidity_label', 'nl:cost_beer_in_cafe_USD', 'nl:cost_local_USD', 'nl:cost_coffee_in_cafe_USD', 'nl:cost_expat_USD', 'nl:cost_airbnb_vs_apartment_price_ratio', 'nl:cost_shortTerm_USD', 'nl:cost_nomad_USD', 'nl:cost_coworking_monthly_USD', 'nl:cost_airbnb_median_USD', 'nl:cost_non_alcoholic_drink_in_cafe_USD', 'nl:cost_longTerm_USD', 'nl:cost_hotel_USD ', 'nl:internet_speed_download'],
		
		displayScores: [
			 'nl:scores_nomad_score', 'nl:scores_places_to_work', 'nl:scores_safety', 'nl:scores_nightlife', 'nl:scores_life_score', 'nl:scores_lgbt_friendly', 'nl:scores_leisure', 'nl:scores_friendly_to_foreigners', 'nl:scores_free_wifi_available', 'nl:scores_aircon', 'nl:scores_female_friendly'
		],
		
		currentFilter: {
			tags: [],
			months: [],
			temperatures: ['Hot', 'Medium', 'Cold'],
			humidities: ['Humid', 'Comfortable', 'Dry'],
			regions: ['Africa', 'Asia', 'Europe', 'Middle East', 'North America', 'Oceania', 'South America'],
			costs: ['$', '$$', '$$$'],
		},
		
		availableCosts: { '$': '?cost < 1500', '$$': '(?cost >= 1500 && ?cost < 4000)', '$$$': '?cost >= 4000' },
		
		availableRegions: { 'Africa': 'Africa', 'Asia': 'Asia', 'Europe': 'Europe', 'Middle East': 'Middle_East', 'North America': 'North_America', 'Oceania': 'Oceania', 'South America': 'South_America' },
		
		availableTags: ['spa', 'outdoors', 'legal weed', 'culture', 'places of worship', 'food', 'beach', 'nightlife', 'hiking', 'low tax', 'temples', 'surfing', 'golf', 'few mosquitos', 'street food', 'diving'],
		
		availableTemperatures: { 'Hot': '?temp >= 25', 'Medium': '(?temp >= 12 && ?temp < 25)', 'Cold': '?temp < 12' },
		
		availableHumidities: [ 'Humid', 'Comfortable', 'Dry' ],
		
		availableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		
		otherFactors: { 'LGBT-friendly': '', 'Fast internet': '', 'Large population': '' },
		
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		
		prefixes: {
			'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf:',
			'http://www.w3.org/2000/01/rdf-schema#': 'rdfs:',
			'http://www.w3.org/2003/01/geo/wgs84_pos#': 'geo:',
			'http://www.w3.org/2002/07/owl#': 'owl:',
			'http://nomadlist.com/': 'nl:',
			'http://jessesar.nl/sw-project/': 'sw:',
			'http://dbpedia.org/resource/': 'dbr:',
			'http://dbpedia.org/ontology/': 'dbo:',
			'http://dbpedia.org/property/': 'dbp:'
		},
		
		currentCityTemplate: {
			'sw:name': '',
			
			rawBindings: []	
		},

	},
	
	watch: {
		currentQuery: function(newQuestion) {
			if(!this.selectedCity) {
				if(this.queryChangeTimer) clearTimeout(this.queryChangeTimer);
				
				this.queryChangeTimer = setTimeout(this.loadResults, 500);
			}
		},
		
		'currentFilter.regions': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		},
		
		'currentFilter.costs': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		},
		
		'currentFilter.tags': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		},
		
		'currentFilter.months': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		},
		
		'currentFilter.temperatures': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		},
		
		'currentFilter.humidities': function(newFilter) {
			var that = this;
			
			Vue.nextTick(function() {
				that.go('filtered-cities');
			});
		}
	},
	
	methods: {
		formatNumber: function(nStr) {
		    nStr += '';
		    x = nStr.split(',');
		    x1 = x[0];
		    x2 = x.length > 1 ? ',' + x[1] : '';
		    var rgx = /(\d+)(\d{3})/;
		    while (rgx.test(x1)) {
		        x1 = x1.replace(rgx, '$1' + '.' + '$2');
		    }
		    return x1 + x2;
		},
		
		replaceSpaces: function(val) {
			return val.replace(new RegExp(' ', 'g'), '_');
		},
		
		toFilterID: function(cat, id) {
			return cat +'-'+ this.replaceSpaces(id);
		},
		
		prefixedURI: function(uri) {
			return replaceByMap(uri, this.prefixes);
		},
		
		readbleURI: function(uri) {
			return uri.substring(3).replace(new RegExp('_', 'g'), ' ').capitalizeFirstLetter()
		},
		
		scoreStyle: function(score) {
			percentage = parseFloat(score) * 100;
			
			return 'width: '+ percentage +'%;';
		},
		
		bindingsToObject: function(bindings) {
			var obj = {};
			
			var that = this;
			
			bindings.forEach(function(b) {
				var key = that.prefixedURI(b.p.value);
				
				if(key in obj) {
					if(typeof obj[key] != 'object') {
						obj[key] = [obj[key]];
					}
					
					if(b.o.type == 'uri') {
						obj[key].push(that.prefixedURI(b.o.value));
					} else {
						obj[key].push(b.o.value);
					}
				} else {
					if(b.o.type == 'uri') {
						obj[key] = that.prefixedURI(b.o.value);
					} else {
						obj[key] = b.o.value;
					}
				}
			});
			
			return obj;
		},
		
		loadQuery: function(key) {
			this.currentQuery = $('#query-placeholders').find('#'+ key).text()
		},
		
		loadResults: function() {
			this.executeQuery(this.showResults, true);
		},
		
		executeQuery: function(cb, reasoning) {
			$.ajax({
				headers: {
					Accept: "application/sparql-results+json"
				},
				
				url: 'http://localhost:5820/sw2016/query',
				data: {
					query: this.currentQuery,
					
					reasoning: reasoning.toString()
				},
				
				success: function(data) {
					cb(data);
				}
			});
		},
		
		showResults: function(data) {
			this.currentCities = data.results.bindings;
		},
		
		go: function(type) {
			this.currentCities = [];
			
			this.loadQuery(type);
			this.loadResults();
		},
		
		entityPicture: function(url) {
			return 'background-image: url('+ url +'); background-repeat: no-repeat; background-size: cover; background-position: center center;';
		},
		
		loadCity: function(city, name, countryName) {
			this.selectedCity = this.prefixedURI(city);
			this.currentCity = { 'sw:name': name, 'sw:countryName': countryName };
			
			var that = this;
			
			Vue.nextTick(function() {
				that.loadQuery('current-city');
				
				that.executeQuery(function(d) {
					that.currentCity = that.bindingsToObject(d.results.bindings);
					that.currentCity.rawBindings = d.results.bindings;
					
					that.currentQuery = 'SELECT ?name WHERE { '+ that.currentCity['nl:country'] +' rdfs:label ?name . FILTER(LANG(?name) = "en") }';
					that.executeQuery(function(d) {
						that.currentCity['sw:countryName'] = d.results.bindings[0].name.value;
						
						that.currentCityLoaded = true;
						
						that.loadPlaces();
					}, true);
				}, true);
			});
		},
		
		loadPlaces: function() {
			this.loadQuery('places');
			
			var that = this;
			this.executeQuery(function(data) {
				that.currentPlaces = data.results.bindings;
			}, true);
		},
		
		loadByTag: function(tag) {
			this.currentFilter.tags = [ tag ];
			
			if($.inArray(tag, this.availableTags) == -1) {
				this.availableTags.unshift(tag);
			}
			
			var that = this;
			
			Vue.nextTick(function() {
				that.loadQuery('filtered-cities');
				that.loadResults();
				
				that.back();
			});
		},
		
		loadByMonth: function(month) {
			this.currentFilter.months = [ month ];
			
			var that = this;
			
			Vue.nextTick(function() {
				that.loadQuery('filtered-cities');
				that.loadResults();
				
				that.back();
			});
		},
		
		back: function(load) {
			if(load) {
				this.loadQuery('filtered-cities');
			}
			
			this.currentCityLoaded = false;
			this.selectedCity = null;
			this.currentCity = Vue.util.extend({}, this.currentCityTemplate);
			this.currentPlaces = [];
		},
		
		switchPlaces: function(type) {
			if(type == 'accommodations') {
				this.placesType = 'nl:Accommodation';
			} else {
				this.placesType = 'nl:Workplace';
			}
			
			var that = this;
			Vue.nextTick(function() {
				that.loadPlaces();
			});
		},
	}
})

app.go('filtered-cities');