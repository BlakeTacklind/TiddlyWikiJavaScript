/*\
Example:
<<TimeLineMacro>>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This is the TimeLineMacro of Tiddly Wiki 5 written in JavaScript
It is used for creating the timeline of events in the world
*/
var shared = require("$:/macro/SharedData.js");

exports.name = "TimeLineMacro";

exports.params = [
	{name: "type"},
	{name: "ibd"},
];


function printTimeline(timeline, type){
	var output = ""
	for (var index in timeline){
		var eventObj = timeline[index];
		output += eventObj.get_time(type) + " [[" + eventObj.event_name + "|"+eventObj.event_tag+"]]<br>";
	}

	return output;
}

function hasField(tiddler, field){
	return typeof tiddler.getFieldString(field) != "undefined" && tiddler.getFieldString(field) != "";
}

function GetEventObjects(wiki, Calendar_List, ignore_birth_deaths=false){

	var timeStampRegEx = /<<TimeStamp\s+"([^"]+)"\s+"([^"]+)">>/g;
	var personSeenRegEx = /<<PersonSeen\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s*>>/g;
	var eventObjects = new Array();

	wiki.each(function(tiddler, title){
		if (!title.startsWith("$")){
			if (hasField(tiddler, "time")){
				var location = "";
				if (hasField(tiddler, "location")){
					location = tiddler.getFieldString("location");
				}

				if (hasField(tiddler, "end")){
					eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("time"), "start of "+title, title, location));
					eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("end"), "end of "+title, title, location));
				}
				else{
					eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("time"), title, title, location));
				}
			}
			else if (hasField(tiddler, "end")){
				eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("end"), title, title, location));
			}


			if (!ignore_birth_deaths && hasField(tiddler, "born")){
				eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("born"), "Birth of "+title, title, ""));
			}

			if (!ignore_birth_deaths && hasField(tiddler, "died")){
				eventObjects.push(new shared.EventObject(Calendar_List, tiddler.getFieldString("died"), "Death of "+title, title, ""));
			}

			var text = tiddler.getFieldString("text");

			var match;
			while(match = timeStampRegEx.exec(text)){
				eventObjects.push(new shared.EventObject(Calendar_List, match[1], match[2], title, ""));
			}

			while(match = personSeenRegEx.exec(text)){
				eventObjects.push(new shared.EventObject(Calendar_List, match[3], match[4] + " " + match[1], title, match[2]));
			}
		}

	});

	return eventObjects;
}

/*
Run the macro
*/
exports.run = function(type, ibd) {
	//Satements for debug
	// console.log(this.wiki);
	// console.log(this.wiki.getTiddler("Now"));

	var cl = shared.GetCalendarList(this.wiki);

	// var eventObjects = GetEventObjects(this.wiki);
	var eventObjects = GetEventObjects(this.wiki, cl, (ibd==0));//GetEventObjects(this.wiki);
	eventObjects = eventObjects.sort(shared.compareTimeObjects);


	if (!type || (!(type in cl))) type = shared.DEFAULT_CALENDAR;

	return printTimeline(eventObjects, type);
};

})();
