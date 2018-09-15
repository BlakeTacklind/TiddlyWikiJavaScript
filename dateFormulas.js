(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var shared = require('$:/macro/SharedData');

// Date to number
exports.dton = function(a){

	var cl = shared.GetCalendarList(this.wiki);

	return shared.parseStringTime(cl, a);
};


})();