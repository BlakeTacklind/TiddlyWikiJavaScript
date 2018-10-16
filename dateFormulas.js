(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var shared = require('$:/macro/SharedData.js');

// Date to number (God Time - days)
exports.dton = function(date_string){

	if (date_string == undefined){
		return undefined;
	}

	var cl = shared.GetCalendarList(this.widget.wiki);

	return shared.parseStringTime(cl, date_string.toString());
};

// Number to years
exports.ntoy = function(date_num, calendar=shared.DEFAULT_CALENDAR){

	if (date_num == undefined){
		return undefined;
	}

	var cl = shared.GetCalendarList(this.widget.wiki);

	return Math.trunc(date_num / cl[calendar].year_len);
};

// Number to Date
exports.ntod = function(date_num, calendar=shared.DEFAULT_CALENDAR){

	if (date_num == undefined){
		return undefined;
	}

	var cl = shared.GetCalendarList(this.widget.wiki);

	return cl[calendar].get_string(date_num);
};


})();